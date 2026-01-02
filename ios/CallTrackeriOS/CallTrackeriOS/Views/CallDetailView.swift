import SwiftUI

struct CallDetailView: View {
    let call: Call
    @ObservedObject var viewModel: CallViewModel
    @State private var notes: String
    
    init(call: Call, viewModel: CallViewModel) {
        self.call = call
        self.viewModel = viewModel
        _notes = State(initialValue: call.notes ?? "")
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Info Card
                VStack(alignment: .leading, spacing: 12) {
                    DetailRow(icon: "person.fill", title: "Name", value: call.name)
                    Divider()
                    DetailRow(icon: "phone.fill", title: "Phone", value: call.phone)
                    Divider()
                    DetailRow(icon: "calendar", title: "Date", value: call.date.formattedDate())
                    Divider()
                    DetailRow(icon: "person.circle", title: "Assignee", value: call.assignee)
                    Divider()
                    HStack {
                        Image(systemName: "flag.fill")
                            .foregroundColor(.gray)
                            .frame(width: 24)
                        Text("Status")
                            .foregroundColor(.gray)
                        Spacer()
                        Text(call.status)
                            .fontWeight(.bold)
                            .foregroundColor(Color.from(status: call.status))
                    }
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(12)
                
                // Notes
                if let notes = call.notes, !notes.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Notes")
                            .font(.headline)
                        Text(notes)
                            .font(.body)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                }
                
                // Attachments
                if let urls = call.attachmentUrls, !urls.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Attachments")
                            .font(.headline)
                            .padding(.bottom, 8)
                        
                        ForEach(urls, id: \.self) { urlString in
                            if let url = URL(string: urlString) {
                                AsyncImage(url: url) { phase in
                                    switch phase {
                                    case .empty:
                                        ProgressView()
                                    case .success(let image):
                                        image.resizable()
                                            .scaledToFit()
                                            .cornerRadius(8)
                                    case .failure:
                                        Image(systemName: "photo")
                                    @unknown default:
                                        EmptyView()
                                    }
                                }
                                .frame(height: 200)
                                .frame(maxWidth: .infinity)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                    }
                    .padding()
                }
                
                // Actions
                VStack(spacing: 12) {
                    if call.status != "SENT" {
                        Button(action: {
                            viewModel.updateStatus(call: call, newStatus: "SENT")
                        }) {
                            Text("Mark as Sent")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    
                    if call.status != "DONE" {
                        Button(action: {
                            viewModel.updateStatus(call: call, newStatus: "DONE")
                        }) {
                            Text("Mark as Done")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.gray)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                }
                .padding(.top)
                
            }
            .padding()
        }
        .navigationTitle("Details")
    }
}

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.gray)
                .frame(width: 24)
            Text(title)
                .foregroundColor(.gray)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}
