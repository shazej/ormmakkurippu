package com.example.calltracker.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object CreateCall : Screen("create_call")
    object CallList : Screen("call_list")
    object CallDetail : Screen("call_detail/{callId}") {
        fun createRoute(callId: String) = "call_detail/$callId"
    }
}
