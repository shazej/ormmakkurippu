package com.example.calltracker.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "calls")
data class CallEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val phone: String,
    val date: Date,
    val assignee: String,
    val status: String, // NEW, SENT, DONE
    val notes: String,
    val attachmentUrls: List<String>,
    val createdAt: Date,
    val createdByUid: String,
    val needsSync: Boolean = false // Flag to sync with Firestore
) {
    // No-arg constructor for Firestore
    constructor() : this("", "", "", Date(), "", "NEW", "", emptyList(), Date(), "", false)
}
