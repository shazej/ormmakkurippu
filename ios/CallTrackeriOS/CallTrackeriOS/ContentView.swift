import SwiftUI

struct ContentView: View {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some View {
        if authViewModel.isAuthenticated {
             DashboardView()
                 .environmentObject(authViewModel)
        } else {
             LoginView()
                 .environmentObject(authViewModel)
        }
    }
}
