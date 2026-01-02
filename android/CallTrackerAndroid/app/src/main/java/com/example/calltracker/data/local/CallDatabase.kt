package com.example.calltracker.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.example.calltracker.data.model.CallEntity

@Database(entities = [CallEntity::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class CallDatabase : RoomDatabase() {
    abstract fun callDao(): CallDao
}
