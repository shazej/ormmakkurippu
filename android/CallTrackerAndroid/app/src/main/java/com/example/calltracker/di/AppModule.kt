package com.example.calltracker.di

import android.content.Context
import androidx.room.Room
import com.example.calltracker.data.local.CallDao
import com.example.calltracker.data.local.CallDatabase
import com.example.calltracker.data.repository.CallRepository
import com.example.calltracker.data.repository.MockCallRepositoryImpl
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import com.example.calltracker.data.repository.CallRepositoryImpl
import com.example.calltracker.data.service.GoogleApiService
import com.example.calltracker.data.service.GeminiAssistant
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): CallDatabase {
        return Room.databaseBuilder(
            context,
            CallDatabase::class.java,
            "call_tracker_db"
        ).build()
    }

    @Provides
    @Singleton
    fun provideCallDao(database: CallDatabase): CallDao {
        return database.callDao()
    }

    @Provides
    @Singleton
    fun provideFirestore(): FirebaseFirestore {
        return FirebaseFirestore.getInstance()
    }

    @Provides
    @Singleton
    fun provideAuth(): FirebaseAuth {
        return FirebaseAuth.getInstance()
    }
    
    @Provides
    @Singleton
    fun provideStorage(): FirebaseStorage {
        return FirebaseStorage.getInstance()
    }

    @Provides
    @Singleton
    fun provideCallRepository(
        dao: CallDao,
        firestore: FirebaseFirestore,
        auth: FirebaseAuth,
        storage: FirebaseStorage,
        googleApiService: GoogleApiService,
        geminiAssistant: GeminiAssistant
    ): CallRepository {
        return CallRepositoryImpl(dao, firestore, auth, storage, googleApiService, geminiAssistant)
    }
}
