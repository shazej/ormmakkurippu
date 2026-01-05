package com.example.calltracker.data.service

import android.content.Context
import com.example.calltracker.data.model.CallEntity
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.HttpTransport
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.calendar.Calendar
import com.google.api.services.calendar.model.Event
import com.google.api.services.calendar.model.EventDateTime
import com.google.api.client.util.DateTime
import com.google.api.services.drive.Drive
import com.google.api.services.drive.model.File
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoogleApiService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val jsonFactory = GsonFactory.getDefaultInstance()
    private val transport: HttpTransport = NetHttpTransport()

    suspend fun createCalendarEvent(call: CallEntity, credential: GoogleAccountCredential) = withContext(Dispatchers.IO) {
        val service = Calendar.Builder(transport, jsonFactory, credential)
            .setApplicationName("Ormmakkurippu")
            .build()

        val event = Event().apply {
            summary = "Call Follow-up: ${call.name}"
            description = "Notes: ${call.notes}\nPhone: ${call.phone}"
            
            // Default to 1 hour event today
            val startDateTime = DateTime(System.currentTimeMillis())
            start = EventDateTime().setDateTime(startDateTime)
            
            val endDateTime = DateTime(System.currentTimeMillis() + 3600000)
            end = EventDateTime().setDateTime(endDateTime)
        }

        service.events().insert("primary", event).execute()
    }

    suspend fun uploadToDrive(fileName: String, content: ByteArray, mimeType: String, credential: GoogleAccountCredential): String = withContext(Dispatchers.IO) {
        val service = Drive.Builder(transport, jsonFactory, credential)
            .setApplicationName("Ormmakkurippu")
            .build()

        val fileMetadata = File().apply {
            name = fileName
            // In a real app, we'd find or create an "Ormmakkurippu" folder here
        }

        val mediaContent = com.google.api.client.http.ByteArrayContent(mimeType, content)
        val file = service.files().create(fileMetadata, mediaContent)
            .setFields("id, webViewLink")
            .execute()

        file.webViewLink ?: ""
    }
}
