import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeUserGenres(userBooks) {
  try {
    const bookSummaries = userBooks.map(
      book => `"${book.book_title}" by ${book.author} (subjects: ${book.subjects || 'Unknown'}, rating: ${book.book_rating}/5)`
    ).join('\n');

    const prompt = `
Analyze this user's reading history and extract their favorite genres. 
Based on the books, their subjects, and ratings, identify the top 3 genres this user prefers.

Books read:
${bookSummaries}

Return only a comma-separated list of the top 3 genres (e.g., "Science Fiction, Mystery, Fantasy"):
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim(); 
  } catch (error) {
    console.error('Error analyzing user genres:', error);
    return 'Fiction, Non-Fiction, General';
  }
}

export async function generateBookRecommendations(favoriteGenres, userBooks) {
  try {
    const readBookTitles = userBooks.map(book => `"${book.book_title}"`).join(', ');
    
    const prompt = `
You are a book recommendation expert. Based on the user's favorite genres: ${favoriteGenres}

The user has already read these books: ${readBookTitles}

Recommend exactly 2 books that match their taste. For each book, provide:
- Title
- Author  
- Genre
- ISBN (if known, otherwise use a realistic ISBN format)
- 2-sentence explanation why this book fits their preferences

Format as JSON array:
[
  {
    "title": "Book Title",
    "author": "Author Name", 
    "genre": "Genre",
    "isbn": "9780123456789",
    "reason": "Explanation why this book matches their taste."
  }
]

Only recommend books NOT in their read list.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawResponse = response.text.trim();
    // Clean up the response to extract JSON
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}


export async function answerBookQuestion(question, context) {
  try {
    const prompt = `
You are an intelligent reading assistant with comprehensive knowledge of books and literature. You help users by combining their personal reading experience with general literary knowledge.

📚 BOOK INFORMATION:
Title: "${context.title}" by ${context.author}
User's Rating: ${context.rating}/5 stars

📝 USER'S PERSONAL NOTES:
${context.notes || "No personal notes available for this book."}

❓ USER'S QUESTION: ${question}

📋 RESPONSE GUIDELINES:
1. **Use Your Full Knowledge**: Draw from your comprehensive knowledge about this book, its author, themes, literary significance, etc.
2. **Incorporate User Context**: When relevant, reference the user's personal notes and their rating/experience
3. **Provide Rich Answers**: Give detailed, informative responses that go beyond just the provided data
4. **Be Comcise in 3 4 lines**: For questions about authors, themes, historical context, etc., use your full literary knowledge
5. **Connect Personal & General**: Show how the user's experience relates to the broader understanding of the book

EXAMPLES OF GOOD RESPONSES:
- Author questions: Provide full biographical info, other works, writing style, plus how it relates to user's notes
- Theme questions: Explain literary themes comprehensively, then connect to user's specific observations
- Character questions: Full character analysis plus user's personal insights

Please provide a comprehensive, knowledgeable answer that enriches the user's understanding:
`;

// console.log("Prompt for AI:", prompt);


    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error answering question:', error);
    return 'I apologize, but I cannot answer that question at the moment.';
  }
}
