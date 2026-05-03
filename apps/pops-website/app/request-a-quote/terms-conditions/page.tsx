import type { Metadata } from "next";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { Hero } from "../../../components/marketing/hero";

export const metadata: Metadata = {
  title: "Terms & Conditions - Pop's Industrial Coatings",
  description: "Our general terms and conditions of sales.",
};

function PdfDownloadLink() {
  return (
    <a
      href="/pdfs/2025-06-07-Pops-Terms-and-Conditions-of-Sale.pdf"
      target="_blank"
      rel="noopener"
      aria-label="Download Terms and Conditions of Sale as PDF — PDF download"
      className="inline-flex items-center gap-2 font-text text-sm font-semibold text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
    >
      <span aria-hidden="true">↓</span>
      <span>Download as PDF</span>
      <span className="text-ink-400 font-normal">(PDF)</span>
    </a>
  );
}

export default function TermsConditionsPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="LEGAL"
          heading="Terms & Conditions"
          lede="General terms and conditions of sale for Pop's Painting Inc. and Pop's Industrial Coatings, Inc."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="mx-auto max-w-[720px]">
              <h2 className="mb-2 font-display text-[22px] leading-[1.2] text-ink-100">
                Pop&apos;s Painting and Pop&apos;s Industrial Coatings
              </h2>
              <h3 className="mb-6 font-text text-lg font-semibold text-ink-300">
                General Terms and Conditions of Sale
              </h3>

              <PdfDownloadLink />

              <div className="mt-10 space-y-6 font-text text-base leading-[1.7] text-ink-100">

                <p><strong>1. Offer.</strong> These Terms and Conditions apply to all goods and/or services (&ldquo;Products&rdquo;) sold and/or performed by Pops Painting Inc and/or Pops Industrial Coatings, Inc. (&ldquo;Seller&rdquo;) and are incorporated into each and every quotation or other document (&ldquo;Quotation&rdquo;) issued by Seller. The Quotation constitutes Seller&rsquo;s offer to the purchaser identified in the Quotation (&ldquo;Purchaser&rdquo;) to sell the Products identified in the Quotation and otherwise to enter into the agreement the Quotation describes, and the Quotation shall be the complete and exclusive statement of such offer and agreement.</p>

                <p><strong>2. Acceptance.</strong> A contract is formed when Purchaser accepts the Quotation by written acknowledgement or by the issuance to Seller of a purchase order or other acceptance document for the Products. Acceptance is expressly limited to these Terms and Conditions and the terms and conditions expressly referenced on the face of the Quotation. Notwithstanding any contrary provision in Purchaser&rsquo;s purchase order or other acceptance document, delivery of Products or commencement of production by Seller shall not constitute acceptance of Purchaser&rsquo;s terms and conditions to the extent any such terms or conditions are inconsistent with or in addition to the terms and conditions contained in the Quotation.</p>

                <p><strong>3. Adjustments.</strong> Seller reserves the right to equitably adjust the price and delivery terms of the Quotation in the event of, and as a condition to, any changes in the specifications or other requirements for Products, the scope of any work covered by the Quotation or any related purchase order, changes in cost or availability of raw materials, components or services, or the estimated annual volumes of Products.</p>

                <p><strong>4a. Shipping and Delivery.</strong> All sales of Products are F.O.B. Seller&rsquo;s facility unless otherwise specified in the Quotation. Responsibility of Seller shall cease upon collection and/or receipt of the Products by a common carrier or any Purchaser arranged collection at which point Purchaser will bear all risk of loss for the Products. Premium shipping expenses and/or other related expenses necessary to meet Purchaser&rsquo;s accelerated delivery schedules shall be the responsibility of Purchaser. Deliveries of orders placed by Purchaser may be changed, deferred or canceled only upon specific agreement in writing by Seller and Seller may condition such agreement upon Purchaser&rsquo;s assumption of liability and payment to Seller for: (a) all completed work at the order price; (b) a sum equal to the costs of work in process including costs accrued for labor and material, (c) any amount for which Seller is liable by reason of commitments made by Seller to its suppliers, and (d) any other loss, cost or expense of Seller as a result of such change, deferment or cancellation. Any Products, which are finish coated must be visually approved by Purchaser prior to pick up, or will be considered accepted as-is when signed by driver of common carrier or other Purchaser arranged collection.</p>

                <p><strong>4b. Storage.</strong> Unless otherwise expressly stated in the Quotation, any completed Products left at Seller&rsquo;s facility over thirty (30) days from date of Seller&rsquo;s invoice will be subject to storage fees up to but not limited to $250 per week.</p>

                <p><strong>5. Payment Terms.</strong> Unless otherwise expressly stated in the Quotation, all accounts are payable in U.S. currency thirty (30) days from the date of Seller&rsquo;s invoice. If any payment owed to Seller is not paid when due, it shall bear interest at the lesser of 18% per annum (1.5% per month) or the maximum rate permitted by law, from the date on which it is due until it is paid. Credit and delivery of Products shall be subject to Seller&rsquo;s approval. In the event Purchaser defaults under its payment terms or Seller otherwise deems itself insecure for any reason, Seller may, without notice, cancel all credit available to Purchaser, require that any invoices outstanding be immediately due and payable in full, and refuse to make any further credit advances. Purchaser is prohibited from and shall not setoff against or recoup from any invoiced amounts due or to become due from Purchaser or its affiliates any amounts due or to become due to Seller or its affiliates, whether arising under the Quotation, any related purchase order or under any other agreement.</p>

                <p><strong>6a. Prices.</strong> Unless otherwise expressly stated in the Quotation, prices for Products specified in the Quotation are firm for 10 days and do not include storage, handling, packaging or transportation charges or any applicable federal, state, local or foreign duties or taxes. Seller reserves the right to increase Product prices in the event of increases in its raw material or component costs or other costs or expenses arising after the date of the Quotation. No price reductions shall apply unless specifically agreed to in writing by Seller.</p>

                <p><strong>6b. Dunnage.</strong> Timber packaging/dunnage including crates, cases, pallets, skids, and or any other timber used as a shipping aid not provided by Purchaser prior to packing, will be billed to Purchaser.</p>

                <p><strong>7. Design.</strong> Seller is not design responsible for any Products and will not have any warranty, indemnification, or other liability or obligations for any actual or alleged defects, quality issues, intellectual property infringement or other nonconformities with respect to any Products to the extent related to or arising out of the design and/or specifications for such Products. While Seller may, from time to time, offer advice, recommendations and/or other suggestions as to the design, use and suitability of any Products, such advice, recommendations and/or other suggestions do not constitute any warranties with respect to any Products. Seller disclaims any such warranties and Buyer assumes full responsibility for accepting and/or using such advice, recommendations and/or other suggestions.</p>

                <p><strong>8. Warranty.</strong> Seller warrants that at the time of invoicing by the Seller the Products will be free from defects in material and workmanship and will conform to the specifications, designs and/or drawings that are a part of the Quotation for a period of twelve (12) months after date of invoice. Any claim for defective materials, defective manufacture, or any other claim with respect to the Products shall be presented to Seller by Purchaser in writing within fifteen (15) days from the date of receipt of the Products by Purchaser. Failure by Purchaser to provide Seller with written notice of any defect within such fifteen (15) day time period shall be deemed an absolute and unconditional waiver of Purchaser&rsquo;s claim for such defects. Purchaser shall hold and make available for inspection and testing by Seller all Products claimed by Purchaser to be defective. Any claim for defective material or workmanship must be verified by Seller and, upon verification, Seller&rsquo;s liability shall be limited to the replacement or repair, at Seller&rsquo;s election, of such part of the Product in question as Seller may determine is defective. Purchaser shall provide Seller with immediate notice of and the opportunity to participate in any and all meetings or other communications between Purchaser and its customer concerning actual or alleged defects with respect to the Products.</p>

                <p className="uppercase text-sm leading-relaxed"><strong>The foregoing warranties are exclusive and Seller makes no other warranty, express or implied, with respect to the Products including, without limitation, any warranties of merchantability or fitness for a particular purpose. Seller specifically, but not by way of limitation, disclaims any and all liability for the use or performance of the Products in the application(s) selected by Purchaser and Purchaser&rsquo;s customers. Seller further disclaims any and all liability for Products that are further processed by Purchaser or any third party or in any way changed by Purchaser or any third party from the Products delivered by Seller. Seller further disclaims any warranties, expressly stated or implied, for application or coating performance whereas Seller applies coatings subsequent to galvanizing application. Seller likewise disclaims any and all liability for raw materials supplied for coatings with steel defects such as but not limited to pits, quench cracks, rollmarks, overlaps, pinchers, burs and/or poor weld quality.</strong></p>

                <p><strong>9. Termination.</strong> In the event, either party fails to perform any of its obligations under the Quotation or any related purchase order and fails to cure such breach within ten (10) days after receipt of written notice from the other party specifying such breach, the nonbreaching party may at its option immediately terminate the Quotation and/or any related purchase orders. Upon any such termination by either party, (a) Seller shall be relieved of any further obligation to Purchaser (including, without limitation, any obligation with respect to production, delivery or transition of supply), (b) Purchaser shall be liable to Seller for the immediate payment of amounts then billed to date by Seller to Purchaser, (c) Purchaser shall purchase and pay Seller immediately for all raw materials, components, work in process and finished goods acquired or produced by Seller in connection with the Quotation and/or any related purchase orders, and (d) Purchaser shall immediately reimburse Seller for all claims of Seller and Seller&rsquo;s subcontractors for unamortized investments involved in preparing to produce or provide or producing or providing Products and for all other loss, cost or expense of Seller as a result of the termination of the Quotation or any related purchase order.</p>

                <p><strong>10. Liability Limitation.</strong> In no event shall Seller&rsquo;s liability arising out of or resulting from any Quotation or any related purchase order, including, without limitation, for the design, manufacture, delivery, sale, repair, replacement or use of any Product, exceed the amounts actually paid by Purchaser for the Products alleged to be the cause of any loss or damage, whether founded in contract, tort (including negligence), strict liability or otherwise. <span className="uppercase">In no event shall Seller be liable to Purchaser for any special, indirect, exemplary, incidental, punitive, or consequential damages (including, without limitation, loss of anticipated profits, loss of use, loss of revenue and cost of capital) arising out of or relating to the Quotation, any related purchase order, or the Products.</span> Any claim by Purchaser against Seller arising out of or relating to the Quotation, any related purchase order, or the Products cannot be filed, made or maintained, and shall be deemed waived, unless filed within six (6) months after Seller has provided the Products in question.</p>

                <p><strong>11. Proprietary Materials.</strong> Seller shall have and retain all rights, title, and interest, including all intellectual property rights, in and to all Products and associated materials, including, without limitation, all related reports, specifications, drawings, designs, computer programs and any other property, tangible or intangible, furnished by Seller in connection with or under the Quotation or any related purchase order (&ldquo;Proprietary Materials&rdquo;). No Proprietary Materials created by Seller in connection with or pursuant to the Quotation or any related purchase order shall be considered &ldquo;works made for hire&rdquo; as that term is used in connection with the U.S. Copyright Act.</p>

                <p><strong>12. Confidentiality.</strong> Purchaser shall maintain the confidentiality of all technical, business, financial, or other non-public information of Seller (&ldquo;Confidential Information&rdquo;) in the same manner in which it protects its own confidential information of like kind, but in no event shall Purchaser take less than reasonable precautions to prevent the unauthorized disclosure, publication, dissemination or use of the Confidential Information. Upon termination of the Quotation and all related purchase orders, Purchaser shall return the Confidential Information and shall not use the Confidential Information for its own, or any third party&rsquo;s, benefit.</p>

                <p><strong>13. Assignment.</strong> The Quotation and/or all related purchase orders shall not be assigned in whole or in part by Purchaser without the prior written consent of Seller.</p>

                <p><strong>14. Compliance.</strong> Purchaser shall be solely responsible for compliance with any federal, state or local laws, rules regulations and ordinances or any industry standards that may be applicable to the Products.</p>

                <p><strong>15. Excusable Delay.</strong> Seller shall not be liable for any delay or failure to perform if such delay or failure to perform is caused by circumstances beyond its reasonable control, including without limitation acts of God or public authority, riots or other public disturbances, labor disputes of any kind, power failures, failure of Purchaser to provide required information, failure of Purchaser to provide adequate containers, or the change in cost or availability of raw materials, components or services based on market conditions, supplier actions or contract disputes. During any such delay or failure to perform by Seller, Seller&rsquo;s obligations under the Quotation and any related purchase order shall be suspended and Seller shall not have any obligation to provide Purchaser with Products from other sources or to pay or reimburse Purchaser for any additional costs to Purchaser of obtaining substitute Products. Seller may, during any period of shortage due to any of the above circumstances allocate its available supply of Products among itself and its customers in any manner that Seller deems fair and reasonable in its sole discretion.</p>

                <p><strong>16. Waiver.</strong> Waiver by Seller of any of the terms or conditions of the Quotation shall be effective only if in writing and signed by Seller and shall not constitute a waiver of such terms as to any subsequent events or conditions, whether similar or dissimilar. No course of dealing or custom in the trade shall constitute a modification or waiver by Seller of any right.</p>

                <p><strong>17. Survival.</strong> These Terms and Conditions shall survive and continue in full force and effect following the expiration, cancellation or termination of a Quotation and any related purchase order.</p>

                <p><strong>18. Entire Agreement.</strong> The Quotation, including these Terms and Conditions and any other attachments, exhibits or supplements specifically referenced in the Quotation, constitutes the entire agreement between Seller and Purchaser with respect to the matters contained in the Quotation and supersedes all prior oral or written representations and agreements. Except as otherwise provided in these Terms and Conditions, the Quotation may only be modified by a written agreement signed by Seller.</p>

                <p><strong>19. Governing Law; Jurisdiction; Venue.</strong> Each Quotation and any purchase order or other documentation between Seller and Purchaser for the Products shall be governed by the internal laws of the State of Florida without regard to any applicable conflict of law&rsquo;s provisions. The United Nations Convention on the International Sale of Goods is expressly excluded. Purchaser consents to the exclusive jurisdiction of the Courts of the State of Florida and the United States District Court for the Middle District of Florida for any action or proceeding arising out of, or in connection with, each Quotation and any purchase order or other documentation between Seller and Purchaser for the Products. Purchaser specifically waives any and all objections to venue in such courts.</p>
              </div>

              <div className="mt-10 border-t border-ink-700 pt-8">
                <PdfDownloadLink />
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
