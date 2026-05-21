package ot

import (
	"fmt"
	"sync"
)

type Document struct {
	Content string
	Version int
	History []*Operation
	mu      sync.RWMutex
}

func NewDocument(content string) *Document {
	return &Document{
		Content: content,
		Version: 0,
		History: make([]*Operation, 0),
	}
}

func (d *Document) GetContent() string {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.Content
}

func (d *Document) GetVersion() int {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.Version
}

func (d *Document) ApplyOperation(op *Operation) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	newContent, err := Apply(d.Content, op)
	if err != nil {
		return fmt.Errorf("failed to apply operation: %w", err)
	}

	d.Content = newContent
	d.Version++
	op.Version = d.Version
	d.History = append(d.History, op)

	// Compact history: keep last 1000 operations
	if len(d.History) > 1000 {
		d.History = d.History[len(d.History)-1000:]
	}

	return nil
}

func (d *Document) GetOperationsSince(version int) []*Operation {
	d.mu.RLock()
	defer d.mu.RUnlock()

	if version >= d.Version {
		return nil
	}

	ops := make([]*Operation, 0)
	for _, op := range d.History {
		if op.Version > version {
			ops = append(ops, op)
		}
	}
	return ops
}
