import Foundation
import Combine
import FirebaseAuth
import UIKit

@MainActor
class CallViewModel: ObservableObject {
    @Published var calls: [Call] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    // Dashboard Stats
    @Published var totalCount = 0
    @Published var newCount = 0
    @Published var sentCount = 0
    
    private let service = FirebaseService.shared
    private var cancellables = Set<AnyCancellable>()
    
    var userId: String? {
        Auth.auth().currentUser?.uid
    }
    
    func fetchCalls() {
        guard let userId = userId else { return }
        isLoading = true
        
        Task {
            do {
                let fetchedCalls = try await service.fetchCalls(for: userId)
                self.calls = fetchedCalls
                self.calculateStats()
                self.isLoading = false
            } catch {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    private func calculateStats() {
        totalCount = calls.count
        newCount = calls.filter { $0.status == "NEW" }.count
        sentCount = calls.filter { $0.status == "SENT" }.count
    }
    
    func addCall(name: String, phone: String, assignee: String, notes: String, attachment: UIImage?) {
        guard let userId = userId else { return }
        isLoading = true
        
        Task {
            do {
                var attachmentUrl: String? = nil
                if let image = attachment {
                    attachmentUrl = try await service.uploadAttachment(image: image, userId: userId)
                }
                
                let call = Call(
                    name: name,
                    phone: phone,
                    date: Date(),
                    assignee: assignee,
                    status: "NEW",
                    notes: notes,
                    attachmentUrls: attachmentUrl != nil ? [attachmentUrl!] : nil,
                    createdAt: Date(),
                    createdByUid: userId
                )
                
                try service.addCall(call)
                await fetchCalls() // Refresh
                self.isLoading = false
            } catch {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func updateStatus(call: Call, newStatus: String) {
        guard let id = call.id else { return }
        Task {
            do {
                try await service.updateStatus(callId: id, newStatus: newStatus)
                // Optimistic update
                if let index = calls.firstIndex(where: { $0.id == id }) {
                    calls[index].status = newStatus
                    calculateStats()
                }
            } catch {
                self.errorMessage = error.localizedDescription
            }
        }
    }
    
    func deleteCall(call: Call) {
        guard let id = call.id else { return }
        Task {
            do {
                try await service.deleteCall(callId: id)
                 if let index = calls.firstIndex(where: { $0.id == id }) {
                    calls.remove(at: index)
                    calculateStats()
                }
            } catch {
                self.errorMessage = error.localizedDescription
            }
        }
    }
}
