# GibbiAI Public API Documentation

## Overview

GibbiAI provides a public API for creating quizzes without requiring user authentication. This API is designed for developers who want to integrate quiz generation functionality into their own applications.

## Base URL

```
http://localhost:3000      # Development
https://gibbi.vercel.app   # Production
```

## Authentication

The API uses API key authentication for security. API keys are optional for development but recommended for production.

### API Key Configuration

Set the `PUBLIC_API_KEYS` environment variable with comma-separated API keys:

```bash
PUBLIC_API_KEYS="your-secret-api-key-1,your-secret-api-key-2"
```

### Using API Keys

Include your API key in requests using either:

1. **Authorization header (Bearer token):**
   ```
   Authorization: Bearer your-secret-api-key-here
   ```

2. **X-API-Key header:**
   ```
   X-API-Key: your-secret-api-key-here
   ```

## Rate Limiting

- **Limit:** 10 requests per minute per IP address
- **Response Headers:**
  - `X-RateLimit-Remaining`: Number of requests remaining in the current window
  - `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
- **Rate Limit Exceeded:** Returns HTTP 429 with reset time information

## Endpoints

### Create Quiz

Creates a new quiz using AI generation.

**Endpoint:** `POST /api/public/quiz/create`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer your-secret-api-key-here  # Optional
```

**Request Body:**
```json
{
  "content": "Machine Learning fundamentals including supervised learning, unsupervised learning, and neural networks",
  "question_count": 10,
  "difficulty": "medium",
  "language": "auto"
}
```

**Parameters:**
- `content` (required): Topic or detailed prompt for quiz generation (minimum 10 characters)
- `question_count` (optional): Number of questions to generate (1-50, default: 10)
- `difficulty` (optional): Quiz difficulty level ("easy", "medium", "hard", default: "medium")
- `language` (optional): Language for quiz generation ("auto", "en", "es", "fr", etc., default: "auto")

**Response (HTTP 200):**
```json
{
  "quiz_id": "3ae06cca-e670-4f7f-98a3-e19efa2ca751",
  "status": "generating",
  "message": "Quiz generation started. Use the quiz_id to check status."
}
```

**Error Responses:**

- **HTTP 400 - Bad Request:**
  ```json
  {
    "error": "No content provided"
  }
  ```

- **HTTP 401 - Unauthorized:**
  ```json
  {
    "error": "Invalid or missing API key"
  }
  ```

- **HTTP 429 - Rate Limit Exceeded:**
  ```json
  {
    "error": "Rate limit exceeded",
    "remaining": 0,
    "resetTime": "2025-08-24T11:11:24.450Z"
  }
  ```

### Check Quiz Status

Check the generation status of a quiz and retrieve the completed quiz data.

**Endpoint:** `GET /api/quiz/status?id={quiz_id}`

**Parameters:**
- `id` (required): The quiz ID returned from the create endpoint

**Response - Generating (HTTP 200):**
```json
{
  "status": "generating"
}
```

**Response - Ready (HTTP 200):**
```json
{
  "status": "ready",
  "quiz": {
    "quiz_id": "3ae06cca-e670-4f7f-98a3-e19efa2ca751",
    "title": "Machine Learning Fundamentals: Practical Applications",
    "description": "A quiz testing understanding of supervised learning...",
    "topic": "Machine Learning",
    "subject": "Computer Science",
    "difficulty": "medium",
    "language": "auto",
    "slug": "machine-learning_3ae06cca-e670-4f7f-98a3-e19efa2ca751",
    "questions": [
      {
        "question_text": "In supervised learning, what is the main purpose of a training dataset?",
        "options": {
          "A": "To test the final model performance",
          "B": "To teach the model patterns in the data",
          "C": "To validate hyperparameter choices",
          "D": "To generate new data points"
        },
        "correct_option": "B"
      }
    ],
    "question_groups": [
      {
        "group_id": 234,
        "supporting_content": {
          "type": "text",
          "content": "A company wants to predict customer churn..."
        },
        "questions": [
          {
            "question_text": "Which approach would be most appropriate?",
            "options": {
              "A": "Unsupervised learning",
              "B": "Supervised classification", 
              "C": "Reinforcement learning",
              "D": "Clustering analysis"
            },
            "correct_option": "B"
          }
        ]
      }
    ]
  }
}
```

**Response - Failed (HTTP 200):**
```json
{
  "status": "failed"
}
```

## CORS Support

The API includes CORS headers for web browser usage:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key`

## Example Usage

### Using cURL

```bash
# Create a quiz (Development)
curl -X POST http://localhost:3000/api/public/quiz/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -d '{
    "content": "JavaScript fundamentals and modern ES6+ features",
    "question_count": 5,
    "difficulty": "medium"
  }'

# Create a quiz (Production)
curl -X POST https://gibbi.vercel.app/api/public/quiz/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -d '{
    "content": "JavaScript fundamentals and modern ES6+ features",
    "question_count": 5,
    "difficulty": "medium"
  }'

# Check quiz status
curl -X GET "https://gibbi.vercel.app/api/quiz/status?id=your-quiz-id-here"
```

### Using JavaScript

```javascript
// Create a quiz
const createQuiz = async () => {
  const response = await fetch('https://gibbi.vercel.app/api/public/quiz/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-secret-api-key-here'
    },
    body: JSON.stringify({
      content: 'JavaScript fundamentals and modern ES6+ features',
      question_count: 5,
      difficulty: 'medium'
    })
  });
  
  const data = await response.json();
  return data.quiz_id;
};

// Check quiz status
const checkQuizStatus = async (quizId) => {
  const response = await fetch(`https://gibbi.vercel.app/api/quiz/status?id=${quizId}`);
  const data = await response.json();
  return data;
};
```

### Using Python

```python
import requests
import time

# Create a quiz
def create_quiz():
    url = "https://gibbi.vercel.app/api/public/quiz/create"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-secret-api-key-here"
    }
    data = {
        "content": "Python programming and data structures",
        "question_count": 8,
        "difficulty": "hard"
    }
    
    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Check quiz status
def get_quiz(quiz_id):
    url = f"https://gibbi.vercel.app/api/quiz/status?id={quiz_id}"
    response = requests.get(url)
    return response.json()

# Usage
result = create_quiz()
quiz_id = result["quiz_id"]

# Wait for generation to complete
while True:
    status = get_quiz(quiz_id)
    if status["status"] == "ready":
        quiz = status["quiz"]
        print(f"Quiz ready: {quiz['title']}")
        break
    elif status["status"] == "failed":
        print("Quiz generation failed")
        break
    else:
        print("Still generating...")
        time.sleep(2)
```

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

## Environment Variables

Add these to your `.env.local` file:

```bash
# Optional: API keys for public API access (comma-separated)
PUBLIC_API_KEYS="your-secret-api-key-here"

# Required: OpenAI API configuration (already configured)
OPENAI_API_KEY="your-openai-key"
AI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-chat"

# Required: Supabase configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## Security Considerations

1. **API Keys**: Use strong, unique API keys in production
2. **Rate Limiting**: Protects against abuse (10 requests/minute per IP)
3. **Input Validation**: All inputs are sanitized and validated
4. **HTTPS**: Use HTTPS in production for secure communication
5. **CORS**: Configured for secure cross-origin requests

## Support

For API support and questions, please refer to the main project documentation or create an issue in the project repository.