import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject var callViewModel = CallViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Welcome")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            Text(authViewModel.user?.displayName ?? "User")
                                .font(.title)
                                .fontWeight(.bold)
                        }
                        Spacer()
                    }
                    .padding()
                    
                    // Stats
                    HStack(spacing: 12) {
                        StatCard(title: "Total Calls", value: "\(callViewModel.totalCount)", color: .blue)
                        StatCard(title: "New", value: "\(callViewModel.newCount)", color: .orange)
                        StatCard(title: "Sent", value: "\(callViewModel.sentCount)", color: .green)
                    }
                    .padding(.horizontal)
                    
                    // Main Action
                    NavigationLink(destination: CreateCallView(viewModel: callViewModel)) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                            Text("New Call Log")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue)
                        .cornerRadius(12)
                    }
                    .padding()
                    
                    // Recent Activity / Link to List
                    NavigationLink(destination: CallListView(viewModel: callViewModel)) {
                        HStack {
                            Text("View Recent Calls")
                            Spacer()
                            Image(systemName: "chevron.right")
                        }
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(10)
                    }
                    .padding(.horizontal)
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                callViewModel.fetchCalls()
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(value)
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(10)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}
