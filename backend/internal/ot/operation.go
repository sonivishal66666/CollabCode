package ot

import "fmt"

type OpType int

const (
	Retain OpType = iota
	Insert
	Delete
)

type Op struct {
	Type  OpType `json:"type"`
	Count int    `json:"count,omitempty"`
	Text  string `json:"text,omitempty"`
}

type Operation struct {
	Ops       []Op   `json:"ops"`
	BaseLen   int    `json:"base_len"`
	TargetLen int    `json:"target_len"`
	Version   int    `json:"version"`
	UserID    string `json:"user_id"`
}

func NewOperation(baseLen int) *Operation {
	return &Operation{
		Ops:       make([]Op, 0),
		BaseLen:   baseLen,
		TargetLen: baseLen,
	}
}

func (o *Operation) Retain(n int) *Operation {
	if n <= 0 {
		return o
	}
	o.Ops = append(o.Ops, Op{Type: Retain, Count: n})
	o.BaseLen += n
	o.TargetLen += n
	return o
}

func (o *Operation) InsertOp(text string) *Operation {
	if text == "" {
		return o
	}
	o.Ops = append(o.Ops, Op{Type: Insert, Text: text})
	o.TargetLen += len([]rune(text))
	return o
}

func (o *Operation) DeleteOp(n int) *Operation {
	if n <= 0 {
		return o
	}
	o.Ops = append(o.Ops, Op{Type: Delete, Count: n})
	o.BaseLen += n
	return o
}

func Apply(doc string, op *Operation) (string, error) {
	runes := []rune(doc)
	if len(runes) != op.BaseLen {
		return "", fmt.Errorf("document length mismatch: expected %d, got %d", op.BaseLen, len(runes))
	}

	result := make([]rune, 0, op.TargetLen)
	idx := 0

	for _, o := range op.Ops {
		switch o.Type {
		case Retain:
			if idx+o.Count > len(runes) {
				return "", fmt.Errorf("retain exceeds document length")
			}
			result = append(result, runes[idx:idx+o.Count]...)
			idx += o.Count
		case Insert:
			result = append(result, []rune(o.Text)...)
		case Delete:
			if idx+o.Count > len(runes) {
				return "", fmt.Errorf("delete exceeds document length")
			}
			idx += o.Count
		}
	}

	if idx != len(runes) {
		return "", fmt.Errorf("operation did not consume entire document: consumed %d of %d", idx, len(runes))
	}

	return string(result), nil
}

func Compose(a, b *Operation) (*Operation, error) {
	if a.TargetLen != b.BaseLen {
		return nil, fmt.Errorf("compose length mismatch: a.target=%d, b.base=%d", a.TargetLen, b.BaseLen)
	}

	result := NewOperation(0)
	result.BaseLen = a.BaseLen
	result.TargetLen = b.TargetLen

	ia, ib := 0, 0
	var opa, opb Op
	aEmpty, bEmpty := true, true

	getA := func() Op {
		if ia < len(a.Ops) {
			op := a.Ops[ia]
			ia++
			return op
		}
		return Op{}
	}
	getB := func() Op {
		if ib < len(b.Ops) {
			op := b.Ops[ib]
			ib++
			return op
		}
		return Op{}
	}

	for {
		if aEmpty {
			opa = getA()
			aEmpty = false
		}
		if bEmpty {
			opb = getB()
			bEmpty = false
		}

		if opa.Type == 0 && opa.Count == 0 && opa.Text == "" &&
			opb.Type == 0 && opb.Count == 0 && opb.Text == "" {
			break
		}

		if opa.Type == Delete {
			result.Ops = append(result.Ops, opa)
			aEmpty = true
			continue
		}
		if opb.Type == Insert {
			result.Ops = append(result.Ops, opb)
			bEmpty = true
			continue
		}

		if opa.Type == 0 && opa.Count == 0 && opa.Text == "" {
			return nil, fmt.Errorf("compose: ran out of a ops")
		}
		if opb.Type == 0 && opb.Count == 0 && opb.Text == "" {
			return nil, fmt.Errorf("compose: ran out of b ops")
		}

		if opa.Type == Retain && opb.Type == Retain {
			if opa.Count > opb.Count {
				result.Ops = append(result.Ops, Op{Type: Retain, Count: opb.Count})
				opa.Count -= opb.Count
				bEmpty = true
			} else if opa.Count < opb.Count {
				result.Ops = append(result.Ops, Op{Type: Retain, Count: opa.Count})
				opb.Count -= opa.Count
				aEmpty = true
			} else {
				result.Ops = append(result.Ops, Op{Type: Retain, Count: opa.Count})
				aEmpty = true
				bEmpty = true
			}
		} else if opa.Type == Insert && opb.Type == Retain {
			insertLen := len([]rune(opa.Text))
			if insertLen > opb.Count {
				r := []rune(opa.Text)
				result.Ops = append(result.Ops, Op{Type: Insert, Text: string(r[:opb.Count])})
				opa.Text = string(r[opb.Count:])
				bEmpty = true
			} else if insertLen < opb.Count {
				result.Ops = append(result.Ops, opa)
				opb.Count -= insertLen
				aEmpty = true
			} else {
				result.Ops = append(result.Ops, opa)
				aEmpty = true
				bEmpty = true
			}
		} else if opa.Type == Insert && opb.Type == Delete {
			insertLen := len([]rune(opa.Text))
			if insertLen > opb.Count {
				r := []rune(opa.Text)
				opa.Text = string(r[opb.Count:])
				bEmpty = true
			} else if insertLen < opb.Count {
				opb.Count -= insertLen
				aEmpty = true
			} else {
				aEmpty = true
				bEmpty = true
			}
		} else if opa.Type == Retain && opb.Type == Delete {
			if opa.Count > opb.Count {
				result.Ops = append(result.Ops, Op{Type: Delete, Count: opb.Count})
				opa.Count -= opb.Count
				bEmpty = true
			} else if opa.Count < opb.Count {
				result.Ops = append(result.Ops, Op{Type: Delete, Count: opa.Count})
				opb.Count -= opa.Count
				aEmpty = true
			} else {
				result.Ops = append(result.Ops, Op{Type: Delete, Count: opa.Count})
				aEmpty = true
				bEmpty = true
			}
		}
	}

	return result, nil
}
