import Foundation
import CoreData
import Combine
import SwiftUI

class CallViewModel: ObservableObject {
    private var viewContext: NSManagedObjectContext
    
    // In a real app, inject this
    // let db = Firestore.firestore()
    
    init(context: NSManagedObjectContext) {
        self.viewContext = context
    }
    
    func addCall(name: String, phone: String, assignee: String, notes: String) {
        let newCall = Call(context: viewContext)
        newCall.id = UUID().uuidString
        newCall.name = name
        newCall.phone = phone
        newCall.assignee = assignee
        newCall.notes = notes
        newCall.date = Date()
        newCall.createdAt = Date()
        newCall.status = "NEW"
        newCall.needsSync = true
        // newCall.createdByUid = Auth.auth().currentUser?.uid
        
        saveContext()
        syncCall(call: newCall)
    }
    
    func updateStatus(call: Call, status: String) {
        call.status = status
        call.needsSync = true
        saveContext()
        syncCall(call: call)
    }
    
    func deleteCall(call: Call) {
        // delete from firestore
        // db.collection("calls").document(call.id!).delete()
        
        viewContext.delete(call)
        saveContext()
    }
    
    private func saveContext() {
        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            print("Unresolved error \(nsError), \(nsError.userInfo)")
        }
    }
    
    private func syncCall(call: Call) {
        // Push to Firestore
        /*
        let data: [String: Any] = [
            "id": call.id ?? "",
            "name": call.name ?? "",
            // ... map other fields
        ]
        db.collection("calls").document(call.id!).setData(data) { err in
            if err == nil {
                call.needsSync = false
                try? self.viewContext.save()
            }
        }
        */
    }
    
    func fetchRemoteCalls() {
        // Pull from Firestore and merge into CoreData
    }
}
