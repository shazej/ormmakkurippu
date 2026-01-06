import SwiftUI

struct CallListView: View {
    @ObservedObject var viewModel: CallViewModel
    @State private var searchText = ""
    @State private var statusFilter: String? = nil
    
    var filteredCalls: [CallModel] {
        viewModel.calls.filter { call in
            let matchesSearch = searchText.isEmpty ||
                call.name.localizedCaseInsensitiveContains(searchText) ||
                call.phone.localizedCaseInsensitiveContains(searchText)
            
            let matchesStatus = statusFilter == nil || call.status == statusFilter
            
            return matchesSearch && matchesStatus
        }
    }
    
    var body: some View {
        VStack {
            // Filter Bar
            ScrollView(.horizontal, showsIndicators: false) {
                HStack {
                    FilterChip(title: "All", isSelected: statusFilter == nil) { statusFilter = nil }
                    FilterChip(title: "New", isSelected: statusFilter == "NEW") { statusFilter = "NEW" }
                    FilterChip(title: "Sent", isSelected: statusFilter == "SENT") { statusFilter = "SENT" }
                    FilterChip(title: "Done", isSelected: statusFilter == "DONE") { statusFilter = "DONE" }
                }
                .padding(.horizontal)
            }
            .padding(.vertical, 8)
            
            List {
                ForEach(filteredCalls) { call in
                    NavigationLink(destination: CallDetailView(call: call, viewModel: viewModel)) {
                        CallRow(call: call)
                    }
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            viewModel.deleteCall(call: call)
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                    .swipeActions(edge: .leading) {
                        if call.status != "SENT" {
                            Button {
                                viewModel.updateStatus(call: call, newStatus: "SENT")
                            } label: {
                                Label("Sent", systemImage: "paperplane")
                            }
                            .tint(.green)
                        }
                    }
                }
            }
            .searchable(text: $searchText)
            .refreshable {
                viewModel.fetchCalls()
            }
        }
        .navigationTitle("Calls")
    }
}

struct CallRow: View {
    let call: CallModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(call.name)
                .font(.headline)
            HStack {
                Text(call.phone)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                Spacer()
                Text(call.status)
                    .font(.caption)
                    .padding(4)
                    .background(Color.from(status: call.status).opacity(0.1))
                    .foregroundColor(Color.from(status: call.status))
                    .cornerRadius(4)
            }
            Text(call.date.formattedDate())
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(UIColor.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}
