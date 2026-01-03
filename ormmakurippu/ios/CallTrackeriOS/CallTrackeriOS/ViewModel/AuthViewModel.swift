import Foundation
import Combine

class AuthViewModel: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var currentUserEmail: String = ""
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Listen to Firebase Auth state
        // Placeholder implementation
        // Auth.auth().addStateDidChangeListener { ... }
        
        // Simulating auth for now since we don't have real Firebase
        // Uncomment below for real
        /*
        Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.isAuthenticated = (user != nil)
            self?.currentUserEmail = user?.email ?? ""
        }
        */
    }
    
    func signIn() {
        // Trigger Google Sign In
        isAuthenticated = true
        currentUserEmail = "test@example.com"
    }
    
    func signOut() {
        /*
        try? Auth.auth().signOut()
        */
        isAuthenticated = false
        currentUserEmail = ""
    }
}
