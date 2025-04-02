import React from 'react';
import Layout from '@/components/Layout';

export default function FAQPage() {
  return (
    <Layout>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Status Workflow Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lead Status Workflow
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Visual representation of how a lead progresses through our system
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <div className="status-workflow-diagram min-w-[700px] p-4">
                  
                  {/* Flow Diagram */}
                  <div className="relative">
                    {/* Initial Status */}
                    <div className="status-node bg-blue-100 border border-blue-300 rounded-lg p-3 w-40 text-center absolute top-0 left-1/2 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    
                    {/* Customer Contact Flow */}
                    <div className="status-node bg-indigo-100 border border-indigo-300 rounded-lg p-3 w-40 text-center absolute top-24 left-1/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Contacted</span>
                    </div>
                    
                    <div className="status-node bg-indigo-100 border border-indigo-300 rounded-lg p-3 w-40 text-center absolute top-48 left-1/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Interested</span>
                    </div>
                    
                    {/* Booking Flow */}
                    <div className="status-node bg-purple-100 border border-purple-300 rounded-lg p-3 w-40 text-center absolute top-72 left-1/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Reserved Booking</span>
                    </div>
                    
                    <div className="status-node bg-purple-100 border border-purple-300 rounded-lg p-3 w-40 text-center absolute top-96 left-1/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Sent Invoice</span>
                    </div>
                    
                    <div className="status-node bg-purple-100 border border-purple-300 rounded-lg p-3 w-40 text-center absolute top-[480px] left-1/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Payment Received</span>
                    </div>
                    
                    <div className="status-node bg-purple-100 border border-purple-300 rounded-lg p-3 w-40 text-center absolute top-[560px] left-1/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Booked</span>
                    </div>
                    
                    {/* Completion Flow */}
                    <div className="status-node bg-green-100 border border-green-300 rounded-lg p-3 w-40 text-center absolute top-[560px] left-2/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Completed Inspection</span>
                    </div>
                    
                    <div className="status-node bg-green-100 border border-green-300 rounded-lg p-3 w-40 text-center absolute top-[480px] left-2/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    
                    {/* Post Service */}
                    <div className="status-node bg-yellow-100 border border-yellow-300 rounded-lg p-3 w-40 text-center absolute top-96 left-2/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Aftersales</span>
                    </div>
                    
                    <div className="status-node bg-yellow-100 border border-yellow-300 rounded-lg p-3 w-40 text-center absolute top-72 left-2/4 transform -translate-x-1/2">
                      <span className="text-sm font-medium">Refunded</span>
                    </div>
                    
                    {/* Terminal States */}
                    <div className="status-node bg-red-100 border border-red-300 rounded-lg p-3 w-40 text-center absolute top-24 right-1/4 transform translate-x-1/2">
                      <span className="text-sm font-medium">Not Available</span>
                    </div>
                    
                    <div className="status-node bg-red-100 border border-red-300 rounded-lg p-3 w-40 text-center absolute top-48 right-1/4 transform translate-x-1/2">
                      <span className="text-sm font-medium">Void</span>
                    </div>
                    
                    {/* Connectors - Add SVG arrows */}
                    <svg className="absolute inset-0 w-full h-[620px] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      {/* Pending → Contacted */}
                      <path d="M 350,35 L 200,95" stroke="#6366F1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Contacted → Interested */}
                      <path d="M 200,135 L 200,165" stroke="#6366F1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Interested → Reserved Booking */}
                      <path d="M 200,215 L 200,245" stroke="#8B5CF6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Reserved Booking → Sent Invoice */}
                      <path d="M 200,295 L 200,325" stroke="#8B5CF6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Sent Invoice → Payment Received */}
                      <path d="M 200,375 L 200,405" stroke="#8B5CF6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Payment Received → Booked */}
                      <path d="M 200,455 L 200,485" stroke="#8B5CF6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Booked → Completed Inspection */}
                      <path d="M 240,535 L 300,535" stroke="#10B981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Completed Inspection → Completed */}
                      <path d="M 350,535 L 350,455" stroke="#10B981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Completed → Aftersales */}
                      <path d="M 350,405 L 350,375" stroke="#F59E0B" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Aftersales can go back to Completed */}
                      <path d="M 380,375 C 420,375 420,435 380,435" stroke="#F59E0B" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Aftersales → Refunded */}
                      <path d="M 350,325 L 350,295" stroke="#F59E0B" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Any stage can go to Not Available */}
                      <path d="M 200,120 L 450,95" stroke="#EF4444" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      <path d="M 200,185 L 450,95" stroke="#EF4444" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
                      <path d="M 200,265 L 450,95" stroke="#EF4444" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="5,5" />
                      
                      {/* Not Available/Void can go back to Pending */}
                      <path d="M 450,95 C 500,60 450,20 380,35" stroke="#6366F1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      <path d="M 450,215 C 500,135 450,20 350,35" stroke="#6366F1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                      
                      {/* Arrowhead definition */}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-[650px] grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                      <span className="text-sm">Initial</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-indigo-100 border border-indigo-300 rounded mr-2"></div>
                      <span className="text-sm">Contact Flow</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
                      <span className="text-sm">Booking Flow</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                      <span className="text-sm">Completion</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
                      <span className="text-sm">Terminal States</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-sm text-gray-500">
                <p className="mb-2"><strong>How the lead status flow works:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>New leads start at <strong>Pending</strong> status</li>
                  <li>After initial contact, leads move to <strong>Contacted</strong> and then <strong>Interested</strong> if applicable</li>
                  <li>The booking process flows through <strong>Reserved Booking</strong>, <strong>Sent Invoice</strong>, <strong>Payment Received</strong>, and <strong>Booked</strong></li>
                  <li>After the inspection is completed, the status changes to <strong>Completed Inspection</strong> and then <strong>Completed</strong></li>
                  <li>Post-service statuses include <strong>Aftersales</strong> and <strong>Refunded</strong> if needed</li>
                  <li>At any point, a lead can be marked as <strong>Not Available</strong> or <strong>Void</strong> if they're no longer interested or available</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                What services do you provide?
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-700">
                We offer comprehensive fire door inspection and compliance services for residential and commercial properties.
                Our services include:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Fire door inspections</li>
                <li>Compliance certification</li>
                <li>Remedial recommendations</li>
                <li>Property-wide fire safety assessments</li>
                <li>Documentation and reporting</li>
              </ul>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                How much does an inspection cost?
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-700">
                Our pricing is based on several factors including the number of doors, property type, and location. 
                For residential properties, our typical pricing is:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>1-5 doors: £150 + VAT</li>
                <li>6-10 doors: £250 + VAT</li>
                <li>11+ doors: Please contact us for a custom quote</li>
              </ul>
              <p className="mt-4 text-gray-700">
                For commercial properties and larger buildings, we provide customized quotes based on a site assessment.
                Please <a href="/contact" className="text-indigo-600 hover:text-indigo-800">contact us</a> for a free consultation and quote.
              </p>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                How long does an inspection take?
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-700">
                The duration of an inspection depends on the number of doors and complexity of the property.
                On average:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li>Small residential properties (1-5 doors): 1-2 hours</li>
                <li>Medium properties (6-15 doors): 2-4 hours</li>
                <li>Large properties (16+ doors): 4+ hours, possibly requiring multiple visits</li>
              </ul>
              <p className="mt-4 text-gray-700">
                We always aim to be thorough while minimizing disruption to your property or business operations.
              </p>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                What happens after an inspection?
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-700">
                Following the inspection, our process includes:
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                <li>A detailed inspection report documenting the condition of each fire door</li>
                <li>Recommendations for any necessary repairs or replacements</li>
                <li>Certification for doors that meet compliance standards</li>
                <li>Digital copies of all documentation for your records</li>
                <li>Optional follow-up consultation to discuss findings and next steps</li>
              </ol>
              <p className="mt-4 text-gray-700">
                If remedial work is required, we can provide recommendations for qualified contractors or arrange the work ourselves through our network of trusted partners.
              </p>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                How often should fire doors be inspected?
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-700">
                Fire door inspection frequency depends on the building type and usage:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                <li><strong>Residential properties:</strong> At least annually, or after any significant changes to the doors</li>
                <li><strong>Commercial buildings:</strong> Every 6 months, or more frequently in high-traffic areas</li>
                <li><strong>High-risk environments:</strong> Quarterly inspections are recommended</li>
                <li><strong>Healthcare facilities:</strong> Every 3-6 months, depending on specific regulations</li>
              </ul>
              <p className="mt-4 text-gray-700">
                Regular inspections are essential for compliance with building regulations and insurance requirements. We can help establish an appropriate inspection schedule for your property.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 