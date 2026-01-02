package com.example.calltracker.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.calltracker.data.model.CallEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CallDao {
    @Query("SELECT * FROM calls ORDER BY date DESC")
    fun getAllCalls(): Flow<List<CallEntity>>

    @Query("SELECT * FROM calls WHERE id = :id")
    suspend fun getCallById(id: String): CallEntity?

    @Query("SELECT * FROM calls WHERE needsSync = 1")
    suspend fun getCallsToSync(): List<CallEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCall(call: CallEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCalls(calls: List<CallEntity>)

    @Update
    suspend fun updateCall(call: CallEntity)

    @Query("DELETE FROM calls WHERE id = :id")
    suspend fun deleteCall(id: String)
    
    @Query("DELETE FROM calls")
    suspend fun clearAll()
}
