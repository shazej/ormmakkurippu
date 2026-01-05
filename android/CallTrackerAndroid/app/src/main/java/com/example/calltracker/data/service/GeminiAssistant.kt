package com.example.calltracker.data.service

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GeminiAssistant @Inject constructor() {
    
    // In a production app, the API key should be managed securely (e.g., via backend or Secrets Gradle Plugin)
    private val apiKey = "YOUR_GEMINI_API_KEY" 
    private val model = GenerativeModel(
        modelName = "gemini-pro",
        apiKey = apiKey
    )

    suspend fun analyzeCallNotes(notes: String): AnalysisResult = withContext(Dispatchers.IO) {
        val prompt = """
            Analyze the following call notes and extract a structured task.
            Notes: ${notes}
            
            Return the result in the following format:
            Summary: [A concise one-line summary]
            Next Action: [The most important next step]
            Assignee: [Who should do it, if mentioned]
            Due Date: [Suggested due date or urgency]
        """.trimIndent()

        try {
            val response = model.generateContent(prompt)
            parseResponse(response.text ?: "")
        } catch (e: Exception) {
            AnalysisResult(summary = "Error analyzing notes", nextAction = notes)
        }
    }

    private fun parseResponse(text: String): AnalysisResult {
        val lines = text.lines()
        return AnalysisResult(
            summary = lines.find { it.startsWith("Summary:") }?.removePrefix("Summary:")?.trim() ?: "",
            nextAction = lines.find { it.startsWith("Next Action:") }?.removePrefix("Next Action:")?.trim() ?: "",
            assignee = lines.find { it.startsWith("Assignee:") }?.removePrefix("Assignee:")?.trim(),
            dueDate = lines.find { it.startsWith("Due Date:") }?.removePrefix("Due Date:")?.trim()
        )
    }
}

data class AnalysisResult(
    val summary: String,
    val nextAction: String,
    val assignee: String? = null,
    val dueDate: String? = null
)
