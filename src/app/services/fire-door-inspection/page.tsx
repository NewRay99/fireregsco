import Link from "next/link";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Fire Door Inspections | Professional Fire Safety Services",
  description: "Expert fire door inspections for HMOs, hotels and commercial properties. Ensure compliance with the Regulatory Reform (Fire Safety) Order 2005.",
};

export default function FireDoorInspectionPage() {
  return (
    <main className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="bg-red-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Fire Door Inspection Services</h1>
            <p className="text-xl mb-8">
              Professional inspections to ensure your fire doors meet all regulatory requirements
            </p>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Our Professional Certifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center max-w-5xl mx-auto">
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-bafe.png" 
                alt="BAFE Certification" 
                width={120} 
                height={60} 
                className="object-contain h-16"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-cpd.png" 
                alt="CPD Certification" 
                width={120} 
                height={60} 
                className="object-contain h-16"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-dsear.png" 
                alt="DSEAR Certification" 
                width={120} 
                height={60} 
                className="object-contain h-16"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-myfire.png" 
                alt="MyFire Certification" 
                width={120} 
                height={60} 
                className="object-contain h-16"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-riskfire.png" 
                alt="RiskFire Certification" 
                width={120} 
                height={60} 
                className="object-contain h-16"
              />
            </div>
            <div className="flex items-center justify-center hover:scale-105 transition-transform">
              <Image 
                src="/certifications/image-rospa.png" 
                alt="ROSPA Certification" 
                width={120} 
                height={60} 
                className="object-contain h-16"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Why Fire Door Inspections Matter</h2>
              <p className="text-gray-600 mb-4">
                Building owners are legally obligated to adhere to the requirements outlined in the Regulatory Reform (Fire Safety) Order 2005, which covers the building's fire safety provisions. Regular inspections of fire doors are required to maintain the standard of fire safety in buildings, as stated in BS8214 (c.13) and BS9999 (Annex L).
              </p>
              <p className="text-gray-600 mb-4">
                It is a common occurrence that the performance of a building's fire door(s) has been compromised by either damage, removal of ironmongery or changes to the door furniture, or just general wear and tear. This is especially present in high traffic buildings such as schools, offices, and hospitality. Without adequate protection, the lives of occupants within the building will be at risk.
              </p>
              <p className="text-gray-600 mb-4">
                Our surveys are inclusive of all internal fire doors. Each door is checked thoroughly to make sure it meets the requirements set by the Regulatory Reform (Fire Safety) Order 2005. A comprehensive report will be provided to the client, highlighting any non-compliant doors so that their maintenance and remediation can be prioritized by the client.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">Our Inspection Process</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mr-4">1</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Initial Assessment</h3>
                    <p className="text-gray-600">
                      We begin with a thorough assessment of all fire doors in your property, identifying their locations and current condition.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mr-4">2</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Detailed Inspection</h3>
                    <p className="text-gray-600">
                      Each door is inspected for compliance with current regulations, checking gaps, seals, hinges, closers, and other essential components.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mr-4">3</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Comprehensive Documentation</h3>
                    <p className="text-gray-600">
                      We document all findings with detailed notes and photographs to provide evidence of the current state of each fire door.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mr-4">4</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Clear Reporting</h3>
                    <p className="text-gray-600">
                      You'll receive a detailed report highlighting any non-compliant doors, with recommendations for remedial actions prioritized by urgency.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mr-4">5</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Follow-up Support</h3>
                    <p className="text-gray-600">
                      We offer guidance on implementing the recommended actions and can provide ongoing inspection services to ensure continued compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6">What We Check</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Door leaf and frame condition</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Gaps between door and frame</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Intumescent and smoke seals</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Hinges and fixings</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Door closers and selectors</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Glazing and glazing seals</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Signage and markings</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Locks, latches and handles</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Door operation and functionality</p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-700 mr-2">✓</span>
                  <p>Fire rating compliance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Requirements Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Legal Requirements</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-bold mb-4">Who is responsible for fire doors?</h3>
              <p className="text-gray-600 mb-6">
                As set out by the Regulatory Reform (Fire Safety) Order 2005, building operators in England and Wales should appoint a 'Responsible Person' to manage all fire safety precautions including fire doors. This person might be the employer, the managing agent or owner or another appointed person. Their legal responsibilities include a duty to reduce the risk of fire spreading within the premises.
              </p>
              
              <h3 className="text-xl font-bold mb-4">Buildings that require fire door inspections:</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
                <li>All business premises (even if part of a domestic dwelling)</li>
                <li>Premises used for charity or voluntary work</li>
                <li>Public buildings such as schools, hospitals, leisure centers</li>
                <li>Entertainment venues and transport stations</li>
                <li>Accommodation for paying guests (B&Bs, hotels, self-catering units)</li>
                <li>Communal areas of HMOs, blocks of flats and maisonettes</li>
              </ul>
              
              <h3 className="text-xl font-bold mb-4">Fire door inspection frequency</h3>
              <p className="text-gray-600 mb-4">
                The Fire Safety (England) Regulations 2022 requires:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
                <li>Quarterly checks of all fire doors in communal areas for buildings over 11m in height</li>
                <li>Annual checks of flat entrance doors within such buildings</li>
                <li>Regular fire door inspections as part of the building's fire risk assessment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Request a Fire Door Inspection</h2>
            <p className="text-center mb-8">
              Please provide information about the number of doors to be inspected so we can provide an accurate quote. We handle projects of all sizes, from small HMOs to large commercial complexes.
            </p>
            <ContactForm />
            <div className="mt-12 text-center">
              <p className="text-xl">Or call us directly at</p>
              <p className="text-2xl font-bold mt-2">07361 991991</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to ensure your fire doors are compliant?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Don't wait until it's too late. Get your fire doors inspected by our certified experts today.
          </p>
          <Link 
            href="#contact" 
            className="bg-white text-red-700 font-bold py-3 px-8 rounded-md hover:bg-gray-100 transition-colors inline-block"
          >
            Book an Inspection
          </Link>
        </div>
      </section>
    </main>
  );
} 