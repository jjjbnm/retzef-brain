# Retzef Subword Neural (experimental)

This is a second, separate from-scratch neural prototype. It uses Unicode grapheme clusters (letters and combining marks) as tokens instead of whole words. Spaces and punctuation are retained, so the model can compose character sequences for words that did not appear as complete words in its training corpus.

Architecture:
- Grapheme-level token embeddings
- A small tanh hidden layer
- Softmax next-token prediction
- Cross-entropy training with backpropagation and SGD

Train with `npm run train:subword`. Output files are written to `models/subword/`.

This is still a tiny educational next-character model, not a Transformer or a ChatGPT-level assistant. It has no broad world knowledge, instruction-following guarantee, or reliable reasoning. Small corpora can produce repetitive or incorrect text. The original word-level neural models remain available separately.
