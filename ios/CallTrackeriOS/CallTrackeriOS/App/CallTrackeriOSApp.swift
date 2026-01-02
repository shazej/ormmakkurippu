import SwiftUI
import FirebaseCore
import GoogleSignIn

@main
struct CallTrackeriOSApp: App {
    // 1. Configure Firebase in init()
    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                // 2. Handle the URL callback for Google Sign-In
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
