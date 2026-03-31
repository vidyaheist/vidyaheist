"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in slide-in-from-bottom-5 duration-700">
      <Card className="shadow-xl bg-card border-2 border-primary/5">
        <CardHeader className="bg-primary/5 border-b py-8">
          <CardTitle className="text-3xl font-black text-center text-primary uppercase">Refund & Return Policy</CardTitle>
          <CardDescription className="text-center font-medium mt-2 italic text-muted-foreground">Verbatim Legal Clauses for VidyaHeist</CardDescription>
        </CardHeader>
        <CardContent className="p-8 prose prose-slate max-w-none text-muted-foreground leading-relaxed">
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground border-b pb-2 mb-4">Refund and Cancellation Policy</h2>
            <p>
              This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service
              that you have purchased through the Platform. Under this policy:
            </p>
            <ol className="space-y-4 mt-4">
              <li>Cancellations will only be considered if the request is made 1 days of placing the order. However,
              cancellation requests may not be entertained if the orders have been communicated to such sellers /
              merchant(s) listed on the Platform and they have initiated the process of shipping them, or the
              product is out for delivery. In such an event, you may choose to reject the product at the doorstep.</li>
              <li>7206150973 does not accept cancellation requests for perishable items like flowers, eatables, etc.
              However, the refund / replacement can be made if the user establishes that the quality of the
              product delivered is not good.</li>
              <li>In case of receipt of damaged or defective items, please report to our customer service team. The
              request would be entertained once the seller/ merchant listed on the Platform, has checked and
              determined the same at its own end. This should be reported within 1 days of receipt of products.</li>
              <li>In case you feel that the product received is not as shown on the site or as per your expectations,
              you must bring it to the notice of our customer service within 1 days of receiving the product. The
              customer service team after looking into your complaint will take an appropriate decision.</li>
              <li>In case of complaints regarding the products that come with a warranty from the manufacturers,
              please refer the issue to them.</li>
              <li>In case of any refunds approved by 7206150973, it will take 14 days for the refund to be processed
              to you.</li>
            </ol>
          </section>

          <section className="mb-12 border-t pt-8">
            <h2 className="text-xl font-bold text-foreground border-b pb-2 mb-4">Return Policy</h2>
            <p>
              We offer refund / exchange within first 5 days from the date of your purchase. If 5 days have passed
              since your purchase, you will not be offered a return, exchange or refund of any kind. In order to become
              eligible for a return or an exchange, (i) the purchased item should be unused and in the same condition as
              you received it, (ii) the item must have original packaging, (iii) if the item that you purchased on a sale,
              then the item may not be eligible for a return / exchange. Further, only such items are replaced by us
              (based on an exchange request), if such items are found defective or damaged.
            </p>
            <p className="mt-4">
              You agree that there may be a certain category of products / items that are exempted from returns or
              refunds. Such categories of the products would be identified to you at the item of purchase. For exchange
              / return accepted request(s) (as applicable), once your returned product / item is received and inspected
              by us, we will send you an email to notify you about receipt of the returned / exchanged product. Further.
              If the same has been approved after the quality check at our end, your request (i.e. return / exchange) will
              be processed in accordance with our policies.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
