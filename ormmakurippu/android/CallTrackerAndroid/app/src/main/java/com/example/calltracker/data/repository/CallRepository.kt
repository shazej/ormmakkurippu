package com.example.calltracker.data.repository

import android.net.Uri
import com.example.calltracker.data.local.CallDao
import com.example.calltracker.data.model.CallEntity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import javax.inject.Inject
import java.util.Date
import java.util.UUID

interface CallRepository {
    fun getAllCalls(): Flow<List<CallEntity>>
    suspend fun getCallById(id: String): CallEntity?
    suspend fun saveCall(call: CallEntity, attachmentUri: Uri? = null)
    suspend fun deleteCall(id: String)
    suspend fun syncCalls()
    fun getCurrentUserUid(): String?
}

class CallRepositoryImpl @Inject constructor(
    private val dao: CallDao,
    private val firestore: FirebaseFirestore,
    private val auth: FirebaseAuth,
    private val storage: FirebaseStorage
) : CallRepository {

    private val callsCollection = firestore.collection("calls")

    override fun getAllCalls(): Flow<List<CallEntity>> = dao.getAllCalls()

    override suspend fun getCallById(id: String): CallEntity? = dao.getCallById(id)

    override suspend fun saveCall(call: CallEntity, attachmentUri: Uri?) {
        val uid = auth.currentUser?.uid ?: return
        var finalCall = call.copy(createdByUid = uid)

        // Upload attachment if present
        if (attachmentUri != null) {
            val ref = storage.reference.child("attachments/${UUID.randomUUID()}.jpg")
            ref.putFile(attachmentUri).await()
            val downloadUrl = ref.downloadUrl.await().toString()
            finalCall = finalCall.copy(attachmentUrls = finalCall.attachmentUrls + downloadUrl)
        }
        
        // Save to Room
        dao.insertCall(finalCall.copy(needsSync = true))
        
        // Try sync to Firestore
        try {
            callsCollection.document(finalCall.id).set(finalCall).await()
            // If successful, mark synced
            dao.insertCall(finalCall.copy(needsSync = false))
        } catch (e: Exception) {
            // Failed to sync, keep needsSync = true (already set)
            e.printStackTrace()
        }
    }

    override suspend fun deleteCall(id: String) {
        dao.deleteCall(id)
        try {
            callsCollection.document(id).delete().await()
        } catch (e: Exception) {
            // Pending delete? Simplification: just delete local for now
            // In a real app we'd need a "deleted" flag for sync
        }
    }

    override suspend fun syncCalls() {
        val uid = auth.currentUser?.uid ?: return
        
        // 1. Push local changes
        val toSync = dao.getCallsToSync()
        for (call in toSync) {
            try {
                callsCollection.document(call.id).set(call).await()
                dao.insertCall(call.copy(needsSync = false))
            } catch (e: Exception) {
                // Keep pending
            }
        }

        // 2. Pull remote changes
        try {
            val snapshot = callsCollection
                .whereEqualTo("createdByUid", uid)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()
            
            val remoteCalls = snapshot.toObjects(CallEntity::class.java)
            dao.insertCalls(remoteCalls.map { it.copy(needsSync = false) })
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    override fun getCurrentUserUid(): String? = auth.currentUser?.uid
}
