package com.example.calltracker.viewmodel

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.calltracker.data.model.CallEntity
import com.example.calltracker.data.repository.CallRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import com.example.calltracker.data.service.AnalysisResult
import java.util.Date
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class CallViewModel @Inject constructor(
    private val repository: CallRepository
) : ViewModel() {

    // All calls from repository
    val allCalls = repository.getAllCalls()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _statusFilter = MutableStateFlow<String?>(null)
    val statusFilter = _statusFilter.asStateFlow()

    // Filtered calls
    val filteredCalls = combine(allCalls, searchQuery, statusFilter) { calls, query, status ->
        calls.filter { call ->
            val matchesQuery = call.name.contains(query, ignoreCase = true) ||
                             call.phone.contains(query, ignoreCase = true)
            val matchesStatus = status == null || call.status == status
            matchesQuery && matchesStatus
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Dashboard stats
    val stats = allCalls.combine(MutableStateFlow(0)) { calls, _ ->
        val total = calls.size
        val newCount = calls.count { it.status == "NEW" }
        val sentCount = calls.count { it.status == "SENT" }
        Triple(total, newCount, sentCount)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), Triple(0, 0, 0))

    fun refresh() {
        viewModelScope.launch {
            repository.syncCalls()
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setStatusFilter(status: String?) {
        _statusFilter.value = status
    }

    fun addCall(name: String, phone: String, assignee: String, notes: String, attachmentUri: Uri?) {
        viewModelScope.launch {
            val call = CallEntity(
                id = UUID.randomUUID().toString(),
                name = name,
                phone = phone,
                date = Date(),
                assignee = assignee,
                status = "NEW",
                notes = notes,
                attachmentUrls = emptyList(),
                createdAt = Date(),
                createdByUid = "", // Repo handles this
                needsSync = true
            )
            repository.saveCall(call, attachmentUri)
        }
    }

    fun updateCallStatus(call: CallEntity, newStatus: String) {
        viewModelScope.launch {
            repository.saveCall(call.copy(status = newStatus))
        }
    }
    
    fun deleteCall(callId: String) {
        viewModelScope.launch {
            repository.deleteCall(callId)
        }
    }

    suspend fun getCallById(id: String): CallEntity? {
        return repository.getCallById(id)
    }

    // AI Features
    private val _analysisResult = MutableStateFlow<AnalysisResult?>(null)
    val analysisResult = _analysisResult.asStateFlow()

    fun analyzeNotes(notes: String) {
        viewModelScope.launch {
            _analysisResult.value = repository.analyzeNotes(notes)
        }
    }

    fun clearAnalysis() {
        _analysisResult.value = null
    }
}
