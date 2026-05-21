package ot

import "fmt"

// Transform takes two operations a and b that were applied concurrently
// to the same document state and returns a' and b' such that:
//   apply(apply(doc, a), b') == apply(apply(doc, b), a')
func Transform(a, b *Operation) (aPrime, bPrime *Operation, err error) {
	if a.BaseLen != b.BaseLen {
		return nil, nil, fmt.Errorf("transform base length mismatch: a=%d, b=%d", a.BaseLen, b.BaseLen)
	}

	aPrime = &Operation{Ops: make([]Op, 0), BaseLen: 0, TargetLen: 0}
	bPrime = &Operation{Ops: make([]Op, 0), BaseLen: 0, TargetLen: 0}

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

	isNoop := func(o Op) bool {
		return o.Type == 0 && o.Count == 0 && o.Text == ""
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

		if isNoop(opa) && isNoop(opb) {
			break
		}

		// Insert in A takes priority
		if opa.Type == Insert {
			insertLen := len([]rune(opa.Text))
			aPrime.Ops = append(aPrime.Ops, opa)
			bPrime.Ops = append(bPrime.Ops, Op{Type: Retain, Count: insertLen})
			aEmpty = true
			continue
		}

		// Insert in B
		if opb.Type == Insert {
			insertLen := len([]rune(opb.Text))
			bPrime.Ops = append(bPrime.Ops, opb)
			aPrime.Ops = append(aPrime.Ops, Op{Type: Retain, Count: insertLen})
			bEmpty = true
			continue
		}

		if isNoop(opa) {
			return nil, nil, fmt.Errorf("transform: ran out of a ops")
		}
		if isNoop(opb) {
			return nil, nil, fmt.Errorf("transform: ran out of b ops")
		}

		// Both are Retain
		if opa.Type == Retain && opb.Type == Retain {
			if opa.Count > opb.Count {
				aPrime.Ops = append(aPrime.Ops, Op{Type: Retain, Count: opb.Count})
				bPrime.Ops = append(bPrime.Ops, Op{Type: Retain, Count: opb.Count})
				opa.Count -= opb.Count
				bEmpty = true
			} else if opa.Count < opb.Count {
				aPrime.Ops = append(aPrime.Ops, Op{Type: Retain, Count: opa.Count})
				bPrime.Ops = append(bPrime.Ops, Op{Type: Retain, Count: opa.Count})
				opb.Count -= opa.Count
				aEmpty = true
			} else {
				aPrime.Ops = append(aPrime.Ops, Op{Type: Retain, Count: opa.Count})
				bPrime.Ops = append(bPrime.Ops, Op{Type: Retain, Count: opa.Count})
				aEmpty = true
				bEmpty = true
			}
		} else if opa.Type == Delete && opb.Type == Delete {
			// Both delete — whoever deletes more, the remainder stays
			if opa.Count > opb.Count {
				opa.Count -= opb.Count
				bEmpty = true
			} else if opa.Count < opb.Count {
				opb.Count -= opa.Count
				aEmpty = true
			} else {
				aEmpty = true
				bEmpty = true
			}
		} else if opa.Type == Delete && opb.Type == Retain {
			if opa.Count > opb.Count {
				aPrime.Ops = append(aPrime.Ops, Op{Type: Delete, Count: opb.Count})
				opa.Count -= opb.Count
				bEmpty = true
			} else if opa.Count < opb.Count {
				aPrime.Ops = append(aPrime.Ops, Op{Type: Delete, Count: opa.Count})
				opb.Count -= opa.Count
				aEmpty = true
			} else {
				aPrime.Ops = append(aPrime.Ops, Op{Type: Delete, Count: opa.Count})
				aEmpty = true
				bEmpty = true
			}
		} else if opa.Type == Retain && opb.Type == Delete {
			if opb.Count > opa.Count {
				bPrime.Ops = append(bPrime.Ops, Op{Type: Delete, Count: opa.Count})
				opb.Count -= opa.Count
				aEmpty = true
			} else if opb.Count < opa.Count {
				bPrime.Ops = append(bPrime.Ops, Op{Type: Delete, Count: opb.Count})
				opa.Count -= opb.Count
				bEmpty = true
			} else {
				bPrime.Ops = append(bPrime.Ops, Op{Type: Delete, Count: opb.Count})
				aEmpty = true
				bEmpty = true
			}
		}
	}

	// Compute final lengths
	aPrime.BaseLen = b.TargetLen
	aPrime.TargetLen = computeTargetLen(aPrime)
	bPrime.BaseLen = a.TargetLen
	bPrime.TargetLen = computeTargetLen(bPrime)

	return aPrime, bPrime, nil
}

func computeTargetLen(op *Operation) int {
	length := 0
	for _, o := range op.Ops {
		switch o.Type {
		case Retain:
			length += o.Count
		case Insert:
			length += len([]rune(o.Text))
		case Delete:
			// delete doesn't add to target
		}
	}
	return length
}
