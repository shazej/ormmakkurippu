import Foundation
import FirebaseAuth
import FirebaseFirestore
import FirebaseStorage
import UIKit

class FirebaseService {
    static let shared = FirebaseService()
    private let db = Firestore.firestore()
    private let storage = Storage.storage().reference()
    
    private init() {}
    
    // MARK: - Calls
    
    func fetchCalls(for userId: String) async throws -> [Call] {
        let snapshot = try await db.collection("calls")
            .whereField("createdByUid", isEqualTo: userId)
            .order(by: "date", descending: true)
            .getDocuments()
        
        return snapshot.documents.compactMap { try? $0.data(as: Call.self) }
    }
    
    func addCall(_ call: Call) throws {
        try db.collection("calls").addDocument(from: call)
    }
    
    func updateStatus(callId: String, newStatus: String) async throws {
        try await db.collection("calls").document(callId).updateData([
            "status": newStatus
        ])
    }
    
    func deleteCall(callId: String) async throws {
        try await db.collection("calls").document(callId).delete()
    }
    
    // MARK: - Storage
    
    func uploadAttachment(image: UIImage, userId: String) async throws -> String {
        guard let imageData = image.jpegData(compressionQuality: 0.7) else {
            throw NSError(domain: "App", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid Image Data"])
        }
        
        let filename = "\(UUID().uuidString).jpg"
        let ref = storage.child("users/\(userId)/attachments/\(filename)")
        
        _ = try await ref.putDataAsync(imageData)
        let url = try await ref.downloadURL()
        return url.absoluteString
    }
}
