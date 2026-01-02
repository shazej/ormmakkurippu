import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showingCreateSheet = false
    
    // Inject ManagedObjectContext from environment
    @Environment(\.managedObjectContext) private var viewContext

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Welcome, \(authViewModel.currentUserEmail)")
                    .font(.headline)
                
                DashboardStatsView()
                    .padding()
                
                NavigationLink(destination: CallListView()) {
                    Text("View All Calls")
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(10)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        authViewModel.signOut()
                    }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingCreateSheet = true
                    }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreateSheet) {
                CreateCallView()
            }
        }
    }
}

struct DashboardStatsView: View {
    @FetchRequest(
        sortDescriptors: [],
        animation: .default)
    private var allCalls: FetchedResults<Call>
    
    var body: some View {
        HStack(spacing: 16) {
            StatCard(title: "Total", value: "\(allCalls.count)")
            StatCard(title: "New", value: "\(allCalls.filter { $0.status == "NEW" }.count)")
            StatCard(title: "Sent", value: "\(allCalls.filter { $0.status == "SENT" }.count)")
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack {
            Text(value)
                .font(.largeTitle)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 2)
    }
}
