package com.example.calltracker.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.calltracker.data.model.CallEntity
import com.example.calltracker.viewmodel.CallViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CallListScreen(
    viewModel: CallViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToDetail: (String) -> Unit
) {
    val calls by viewModel.filteredCalls.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Calls") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            TextField(
                value = searchQuery,
                onValueChange = viewModel::setSearchQuery,
                label = { Text("Search") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(horizontal = 16.dp)
            ) {
                items(calls, key = { it.id }) { call ->
                    val dismissState = rememberSwipeToDismissBoxState(
                        confirmValueChange = {
                            if (it == SwipeToDismissBoxValue.EndToStart) {
                                viewModel.deleteCall(call.id)
                                true
                            } else if (it == SwipeToDismissBoxValue.StartToEnd) {
                                viewModel.updateCallStatus(call, "SENT")
                                false // Don't dismiss, just action
                            } else {
                                false
                            }
                        }
                    )

                    SwipeToDismissBox(
                        state = dismissState,
                        backgroundContent = {
                             Row(
                                 modifier = Modifier
                                     .fillMaxSize()
                                     .padding(horizontal = 20.dp),
                                 horizontalArrangement = Arrangement.SpaceBetween,
                                 verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                             ) {
                                 Icon(Icons.Default.Send, "Mark Sent", tint = Color.Green)
                                 Icon(Icons.Default.Delete, "Delete", tint = Color.Red)
                             }
                        },
                        content = {
                            CallItem(call = call, onClick = { onNavigateToDetail(call.id) })
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun CallItem(call: CallEntity, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        ListItem(
            headlineContent = { Text(call.name) },
            supportingContent = { Text("${call.phone} • ${call.status}") },
            trailingContent = { Text(call.date.toString().take(10)) } // Simple date format
        )
    }
}
