package com.example.calltracker.ui.screens

import android.util.Log

import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.calltracker.viewmodel.AuthViewModel
// import com.google.android.gms.auth.api.signin.GoogleSignIn
// import com.google.android.gms.auth.api.signin.GoogleSignInOptions
// import com.google.android.gms.common.api.ApiException
import com.example.calltracker.R

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: () -> Unit
) {
    val user by viewModel.currentUser.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val context = LocalContext.current

    // Observe user state
    LaunchedEffect(user) {
        Log.d("LoginScreen", "User state changed: $user")
        if (user != null) {
            Log.d("LoginScreen", "Login successful, navigating...")
            onLoginSuccess()
        }
    }

    // Configure Google Sign-In (Stubbed)
    val clientId = ""
    
    // val gso = ...
    // val googleSignInLauncher = ...

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Call Tracker",
                style = MaterialTheme.typography.headlineLarge
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            if (isLoading) {
                CircularProgressIndicator()
            } else {
                Button(onClick = {
                    // if (clientId.isEmpty()) {
                    //     // Show error or alert if config is missing
                    //     return@Button
                    // }
                    // val googleSignInClient = GoogleSignIn.getClient(context, gso)
                    // googleSignInLauncher.launch(googleSignInClient.signInIntent)
                    viewModel.signInWithGoogle("mock_token")
                }) {
                    Text("Sign in with Google (Bypassed)")
                }
            }

            if (error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = error!!,
                    color = MaterialTheme.colorScheme.error
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = if (clientId.isEmpty()) "Missing google-services.json" else "Ready to sign in",
                style = MaterialTheme.typography.bodySmall,
                color = if (clientId.isEmpty()) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary
            )
        }
    }
}
