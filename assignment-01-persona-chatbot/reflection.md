# Reflection — Persona-Based AI Chatbot

## What Worked Well

The most impactful decision was investing heavily in research before writing a single line of the system prompts. By reading interviews, watching YouTube talks, and studying student reviews of all three personas, I was able to capture specific biographical details, signature phrases, and communication patterns that made each chatbot feel genuinely distinct. For example, embedding Anshuman's "education is about addiction, not content" philosophy and Kshitij's Socratic teaching approach directly into the system prompts meant the model had concrete behavioral anchors rather than vague personality descriptions.

The few-shot examples proved to be the most powerful component of the prompts. Including three carefully crafted Q&A pairs per persona — each demonstrating a different facet of their personality — gave the model a clear template for tone, structure, and depth. The difference between responses with and without few-shot examples was dramatic: with them, Abhimanyu consistently opened responses with data points, and Kshitij consistently ended with challenge questions, exactly mirroring their real-world behavior.

## What GIGO Taught Me

The Garbage In, Garbage Out principle was the central lesson of this assignment, and I experienced it firsthand. My first draft of Anshuman's prompt was a single paragraph: "You are Anshuman Singh, co-founder of Scaler. Be helpful, inspirational, and friendly." The resulting responses were indistinguishable from a generic ChatGPT conversation — polite but hollow. The model had no raw material to work with, so it produced the blandest possible output.

Once I replaced that with a detailed biography, specific communication style directives, three diverse few-shot examples, and explicit constraints on what not to do, the transformation was immediate. The model started referencing Facebook Messenger, using Anshuman's characteristic directness, and ending responses with provocative questions — all without any code changes. The prompt was the product. This experience made the GIGO principle visceral: the quality of your input is the ceiling for your output, and no amount of engineering can compensate for a lazy prompt.

## What I Would Improve

If I had more time, I would add memory and context persistence across sessions, so returning users could pick up conversations where they left off. I would also implement a rating system where users could flag responses that "don't sound like" the persona, creating a feedback loop for prompt refinement. Finally, I would explore using RAG (Retrieval-Augmented Generation) to feed the model actual transcripts from each persona's talks and classes, rather than relying solely on my summarized research — this would push authenticity even further.
