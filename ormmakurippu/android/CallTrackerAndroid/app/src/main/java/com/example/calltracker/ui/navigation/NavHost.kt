package com.example.calltracker

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.calltracker.ui.navigation.Screen
import com.example.calltracker.ui.screens.CallDetailScreen
import com.example.calltracker.ui.screens.CallListScreen
import com.example.calltracker.ui.screens.CreateCallScreen
import com.example.calltracker.ui.screens.DashboardScreen
import com.example.calltracker.ui.screens.LoginScreen
import com.example.calltracker.viewmodel.AuthViewModel
import com.example.calltracker.viewmodel.CallViewModel

@Composable
fun CallTrackerNavHost() {
    val navController = rememberNavController()
    // Normally injected per screen or scoped nav graph, getting here for simplicity
    val authViewModel: AuthViewModel = hiltViewModel()
    
    // Start dest depends on auth, simpler to just start at Login and let it auto-forward
    NavHost(navController = navController, startDestination = Screen.Login.route) {
        
        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Dashboard.route) {
            val callViewModel: CallViewModel = hiltViewModel()
            DashboardScreen(
                authViewModel = authViewModel,
                callViewModel = callViewModel,
                onNavigateToCreate = { navController.navigate(Screen.CreateCall.route) },
                onNavigateToList = { navController.navigate(Screen.CallList.route) },
                onSignOut = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.CreateCall.route) {
            val callViewModel: CallViewModel = hiltViewModel()
            CreateCallScreen(
                viewModel = callViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable(Screen.CallList.route) {
            val callViewModel: CallViewModel = hiltViewModel()
            CallListScreen(
                viewModel = callViewModel,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToDetail = { callId ->
                    navController.navigate(Screen.CallDetail.createRoute(callId))
                }
            )
        }
        
        composable(
            route = Screen.CallDetail.route,
            arguments = listOf(navArgument("callId") { type = NavType.StringType })
        ) { backStackEntry ->
            val callId = backStackEntry.arguments?.getString("callId") ?: return@composable
            val callViewModel: CallViewModel = hiltViewModel()
            CallDetailScreen(
                callId = callId,
                viewModel = callViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
