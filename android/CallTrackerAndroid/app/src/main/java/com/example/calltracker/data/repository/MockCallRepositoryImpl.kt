package com.example.calltracker.data.repository

import android.net.Uri
import com.example.calltracker.data.local.CallDao
import com.example.calltracker.data.model.CallEntity
import com.example.calltracker.data.service.AnalysisResult
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class MockCallRepositoryImpl @Inject constructor(
    private val dao: CallDao
) : CallRepository {

    override fun getAllCalls(): Flow<List<CallEntity>> = dao.getAllCalls()

    override suspend fun getCallById(id: String): CallEntity? = dao.getCallById(id)

    override suspend fun saveCall(call: CallEntity, attachmentUri: Uri?) {
        // Just save to Room, ignore Firebase and attachments for now
        dao.insertCall(call.copy(needsSync = false, createdByUid = "mock_user_uid"))
    }

    override suspend fun deleteCall(id: String) {
        dao.deleteCall(id)
    }

    override suspend fun syncCalls() {
        // No-op for mock
    }

    override fun getCurrentUserUid(): String? = "mock_user_uid"

    override suspend fun analyzeNotes(notes: String): AnalysisResult {
        return AnalysisResult(summary = "Mock AI Summary", nextAction = "Mock Action")
    }
}
