'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeadStats {
  total: number;
  pending: number;
  contacted: number;
  sentInvoice: number;
  completed: number;
  notAvailable: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    pending: 0,
    contacted: 0,
    sentInvoice: 0,
    completed: 0,
    notAvailable: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch(`/api/leads?_=${new Date().getTime()}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data) {
            // Calculate stats from leads
            const leads = data.data;
            const newStats = {
              total: leads.length,
              pending: leads.filter((l: any) => l.status === 'pending').length,
              contacted: leads.filter((l: any) => l.status === 'contacted').length,
              sentInvoice: leads.filter((l: any) => l.status === 'sent invoice').length,
              completed: leads.filter((l: any) => l.status === 'completed').length,
              notAvailable: leads.filter((l: any) => l.status === 'not available').length
            };
            
            setStats(newStats);
          }
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeads();
  }, []);

  const statusCards = [
    { 
      name: 'Pending Leads', 
      count: stats.pending, 
      color: 'bg-yellow-100 text-yellow-800',
      path: '/admin/leads',
      query: '?status=pending'
    },
    { 
      name: 'Contacted', 
      count: stats.contacted, 
      color: 'bg-blue-100 text-blue-800',
      path: '/admin/leads',
      query: '?status=contacted'
    },
    { 
      name: 'Sent Invoice', 
      count: stats.sentInvoice, 
      color: 'bg-purple-100 text-purple-800',
      path: '/admin/leads',
      query: '?status=sent+invoice'
    },
    { 
      name: 'Completed', 
      count: stats.completed, 
      color: 'bg-green-100 text-green-800',
      path: '/admin/leads',
      query: '?status=completed'
    },
    { 
      name: 'Not Available', 
      count: stats.notAvailable, 
      color: 'bg-gray-100 text-gray-800',
      path: '/admin/leads',
      query: '?status=not+available'
    }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold pb-6">Admin Dashboard</h1>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold pb-6">Admin Dashboard</h1>
      
      {/* Quick stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statusCards.map((card) => (
          <Link 
            href={`${card.path}${card.query}`} 
            key={card.name}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3" aria-hidden="true">
                  <div className={`h-12 w-12 ${card.color} rounded-full flex items-center justify-center`}>
                    <span className="text-lg font-semibold">{card.count}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Links
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-3">
              <Link href="/admin/leads" className="text-blue-600 hover:text-blue-800 block">
                View All Leads
              </Link>
              <Link href="/admin/reports" className="text-blue-600 hover:text-blue-800 block">
                View Reports
              </Link>
              <Link href="/admin/setup" className="text-blue-600 hover:text-blue-800 block">
                Setup Guide
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500">
              For detailed reports and analytics, please visit the 
              <Link href="/admin/reports" className="text-blue-600 hover:text-blue-800 mx-1">
                Reports
              </Link> 
              page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 