package ot

import (
	"fmt"
	"log"
	"sync"
)

type Workspace struct {
	Documents map[string]*Document
	Mu        sync.RWMutex
}

func NewWorkspace() *Workspace {
	return &Workspace{
		Documents: make(map[string]*Document),
	}
}

func (w *Workspace) GetOrCreateDocument(fileID, initialContent string) *Document {
	w.Mu.Lock()
	defer w.Mu.Unlock()

	if doc, exists := w.Documents[fileID]; exists {
		return doc
	}

	doc := NewDocument(initialContent)
	w.Documents[fileID] = doc
	return doc
}

func (w *Workspace) GetDocument(fileID string) (*Document, bool) {
	w.Mu.RLock()
	defer w.Mu.RUnlock()
	doc, exists := w.Documents[fileID]
	return doc, exists
}

type Engine struct {
	workspaces map[string]*Workspace
	mu         sync.RWMutex
}

func NewEngine() *Engine {
	return &Engine{
		workspaces: make(map[string]*Workspace),
	}
}

func (e *Engine) GetWorkspace(roomID string) *Workspace {
	e.mu.Lock()
	defer e.mu.Unlock()

	if ws, exists := e.workspaces[roomID]; exists {
		return ws
	}

	ws := NewWorkspace()
	e.workspaces[roomID] = ws
	return ws
}

func (e *Engine) RemoveWorkspace(roomID string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	delete(e.workspaces, roomID)
}

// ReceiveOperation processes a client operation for a specific file:
// 1. Transforms it against any ops that happened since the client's base version
// 2. Applies the transformed op to the document
// 3. Returns the transformed op for broadcasting
func (e *Engine) ReceiveOperation(roomID string, fileID string, clientOp *Operation, clientVersion int) (*Operation, int, error) {
	ws := e.GetWorkspace(roomID)
	doc, exists := ws.GetDocument(fileID)
	if !exists {
		return nil, 0, fmt.Errorf("document not found for file %s in room %s", fileID, roomID)
	}

	doc.mu.Lock()
	defer doc.mu.Unlock()

	// Get all operations that happened since the client's version
	concurrentOps := make([]*Operation, 0)
	for _, op := range doc.History {
		if op.Version > clientVersion {
			concurrentOps = append(concurrentOps, op)
		}
	}

	// Transform client op against each concurrent op
	transformedOp := clientOp
	for _, serverOp := range concurrentOps {
		var err error
		transformedOp, _, err = Transform(transformedOp, serverOp)
		if err != nil {
			log.Printf("OT transform error in room %s file %s: %v", roomID, fileID, err)
			return nil, 0, fmt.Errorf("transform error: %w", err)
		}
	}

	// Apply transformed operation to document
	newContent, err := Apply(doc.Content, transformedOp)
	if err != nil {
		return nil, 0, fmt.Errorf("apply error: %w", err)
	}

	doc.Content = newContent
	doc.Version++
	transformedOp.Version = doc.Version
	doc.History = append(doc.History, transformedOp)

	if len(doc.History) > 1000 {
		doc.History = doc.History[len(doc.History)-1000:]
	}

	return transformedOp, doc.Version, nil
}
