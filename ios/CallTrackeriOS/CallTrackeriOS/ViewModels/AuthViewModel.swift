import Foundation
import SwiftUI
import FirebaseAuth
import FirebaseCore
import GoogleSignIn

class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var errorMessage: String?
    
    init() {
        self.user = Auth.auth().currentUser
        Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.user = user
        }
    }
    
    func signInWithGoogle() {
        // 1. Retrieve Client ID from Firebase
        guard let clientID = FirebaseApp.app()?.options.clientID else { return }
        
        // 2. Configure Google Sign-In
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config
        
        // 3. Get Top View Controller for presentation
        guard let rootViewController = UIApplication.shared.topViewController else {
            self.errorMessage = "Could not find root view controller"
            return
        }
              
        // 4. Start Sign-In Flow
        GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController) { [weak self] Result, error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            guard let user = Result?.user,
                  let idToken = user.idToken?.tokenString else {
                self?.errorMessage = "Invalid Google User Data"
                return
            }
            
            let accessToken = user.accessToken.tokenString
            
            // 5. Create Firebase Credential
            let credential = GoogleAuthProvider.credential(withIDToken: idToken,
                                                         accessToken: accessToken)
            
            // 6. Auth with Firebase
            Auth.auth().signIn(with: credential) { _, error in
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func signOut() {
        do {
            try Auth.auth().signOut()
            GIDSignIn.sharedInstance.signOut()
            self.user = nil
        } catch {
            self.errorMessage = error.localizedDescription
        }
    }
}
