import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Call Tracker")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Button(action: {
                authViewModel.signIn()
            }) {
                HStack {
                    Image(systemName: "globe")
                    Text("Sign in with Google")
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .padding(.horizontal)
            
            Text("Note: Add GoogleService-Info.plist to enable real Auth")
                .font(.caption)
                .foregroundColor(.red)
        }
    }
}
