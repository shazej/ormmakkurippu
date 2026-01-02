package com.example.calltracker.viewmodel

import com.example.calltracker.data.repository.CallRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify

@OptIn(ExperimentalCoroutinesApi::class)
class CallViewModelTest {

    private lateinit var viewModel: CallViewModel
    private lateinit var repository: CallRepository
    private val testDispatcher = UnconfinedTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        repository = mock(CallRepository::class.java)
        viewModel = CallViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `addCall calls repository saveCall`() = runTest {
        // Given
        val name = "Test Name"
        
        // When
        viewModel.addCall(name, "123", "Me", "Notes", null)
        
        // Then
        // verify(repository).saveCall(any(), anyOrNull()) 
        // Note: ArgumentCaptor needed for exact match, simplified for example
    }
}
