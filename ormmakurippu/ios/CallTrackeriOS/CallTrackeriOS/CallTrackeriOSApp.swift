import SwiftUI
import CoreData

@main
struct CallTrackeriOSApp: App {
    // Inject persistence controller
    let persistenceController = PersistenceController.shared
    
    // Setup Firebase on launch
    init() {
        // Placeholder for Firebase configuration
        // FirebaseApp.configure() 
        // Note: User needs to add GoogleService-Info.plist and uncomment this
        print("Remember to uncomment FirebaseApp.configure() after adding GoogleService-Info.plist")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
