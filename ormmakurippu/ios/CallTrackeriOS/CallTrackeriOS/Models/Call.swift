import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct Call: Identifiable, Codable, Hashable {
    @DocumentID var id: String?
    var name: String
    var phone: String
    var date: Date
    var assignee: String
    var status: String // NEW, SENT, DONE
    var notes: String?
    var attachmentUrls: [String]?
    var createdAt: Date
    var createdByUid: String
    
    // CodingKeys removed to allow @DocumentID to work automatically
}
