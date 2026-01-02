package com.example.calltracker.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.calltracker.data.model.CallEntity
import com.example.calltracker.viewmodel.CallViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CallDetailScreen(
    callId: String,
    viewModel: CallViewModel,
    onNavigateBack: () -> Unit
) {
    var call by remember { mutableStateOf<CallEntity?>(null) }

    LaunchedEffect(callId) {
        call = viewModel.getCallById(callId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Call Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        val currentCall = call ?: return@Scaffold
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            DetailItem(label = "Name", value = currentCall.name)
            DetailItem(label = "Phone", value = currentCall.phone)
            DetailItem(label = "Assignee", value = currentCall.assignee)
            DetailItem(label = "Status", value = currentCall.status)
            DetailItem(label = "Date", value = currentCall.date.toString())
            
            if (currentCall.notes.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Notes", style = MaterialTheme.typography.labelLarge)
                Text(currentCall.notes, style = MaterialTheme.typography.bodyLarge)
            }

            if (currentCall.attachmentUrls.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Attachments", style = MaterialTheme.typography.labelLarge)
                currentCall.attachmentUrls.forEach { url ->
                     Text(
                         text = "View Attachment", 
                         color = MaterialTheme.colorScheme.primary,
                         modifier = Modifier.padding(vertical = 4.dp)
                         // logic to open URL can be added here
                     )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Row(modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = { 
                        viewModel.updateCallStatus(currentCall, "SENT")
                        call = currentCall.copy(status = "SENT")
                    },
                    modifier = Modifier.weight(1f).padding(end = 8.dp),
                    enabled = currentCall.status != "SENT"
                ) {
                    Text("Mark Sent")
                }
                
                Button(
                    onClick = { 
                         viewModel.updateCallStatus(currentCall, "DONE") 
                         call = currentCall.copy(status = "DONE")
                    },
                    modifier = Modifier.weight(1f).padding(start = 8.dp),
                    enabled = currentCall.status != "DONE"
                ) {
                    Text("Mark Done")
                }
            }
        }
    }
}

@Composable
fun DetailItem(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.titleMedium)
    }
}
