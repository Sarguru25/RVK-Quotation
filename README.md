
```
quotation-2
├─ README.md
├─ eslint.config.mjs
├─ jsconfig.json
├─ middleware.js
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ TF_logo.png
│  └─ TF_logo2.png
└─ src
   ├─ app
   │  ├─ (auth)
   │  │  ├─ login
   │  │  │  └─ page.js
   │  │  └─ register
   │  │     └─ page.js
   │  ├─ api
   │  │  ├─ attachment
   │  │  │  └─ route.js
   │  │  ├─ auth
   │  │  │  ├─ [...nextauth]
   │  │  │  │  └─ route.js
   │  │  │  └─ register
   │  │  │     └─ route.js
   │  │  ├─ customers
   │  │  │  └─ [id]
   │  │  │     └─ analytics
   │  │  │        └─ route.js
   │  │  ├─ quotations
   │  │  │  ├─ [id]
   │  │  │  │  ├─ route.js
   │  │  │  │  └─ sync
   │  │  │  │     └─ route.js
   │  │  │  └─ route.js
   │  │  ├─ roles
   │  │  │  ├─ [id]
   │  │  │  │  └─ route.js
   │  │  │  └─ route.js
   │  │  ├─ sync
   │  │  │  ├─ customers
   │  │  │  │  └─ route.js
   │  │  │  ├─ items
   │  │  │  │  └─ route.js
   │  │  │  ├─ quotations
   │  │  │  │  └─ route.js
   │  │  │  └─ taxes
   │  │  │     └─ route.js
   │  │  ├─ users
   │  │  │  ├─ [id]
   │  │  │  │  └─ route.js
   │  │  │  └─ route.js
   │  │  └─ zoho
   │  │     ├─ callback
   │  │     │  └─ route.js
   │  │     ├─ customers
   │  │     │  ├─ [id]
   │  │     │  │  └─ route.js
   │  │     │  └─ route.js
   │  │     ├─ items
   │  │     │  ├─ [id]
   │  │     │  │  └─ route.js
   │  │     │  ├─ create
   │  │     │  │  └─ route.js
   │  │     │  └─ route.js
   │  │     ├─ login
   │  │     │  └─ route.js
   │  │     ├─ quotations
   │  │     │  └─ [id]
   │  │     │     ├─ approve
   │  │     │     │  └─ route.js
   │  │     │     ├─ convert-so
   │  │     │     │  └─ route.js
   │  │     │     ├─ mark-accepted
   │  │     │     │  └─ route.js
   │  │     │     ├─ mark-sent
   │  │     │     │  └─ route.js
   │  │     │     ├─ pdf
   │  │     │     │  └─ route.js
   │  │     │     ├─ send-email
   │  │     │     │  └─ route.js
   │  │     │     ├─ share
   │  │     │     │  └─ route.js
   │  │     │     └─ submit-approval
   │  │     │        └─ route.js
   │  │     ├─ quotes
   │  │     │  ├─ [id]
   │  │     │  │  └─ route.js
   │  │     │  ├─ create
   │  │     │  │  └─ route.js
   │  │     │  └─ route.js
   │  │     ├─ sync
   │  │     │  └─ [id]
   │  │     │     └─ route.js
   │  │     └─ taxes
   │  │        └─ route.js
   │  ├─ components
   │  │  ├─ DataTable.jsx
   │  │  ├─ ErrorMessage.js
   │  │  ├─ Loading.js
   │  │  └─ Sidebar.js
   │  ├─ dashboard
   │  │  ├─ customers
   │  │  │  ├─ [id]
   │  │  │  │  ├─ CustomerView.jsx
   │  │  │  │  ├─ PrintButton.jsx
   │  │  │  │  ├─ edit
   │  │  │  │  │  └─ page.jsx
   │  │  │  │  └─ page.jsx
   │  │  │  ├─ new
   │  │  │  │  └─ page.jsx
   │  │  │  └─ page.jsx
   │  │  ├─ items
   │  │  │  ├─ [id]
   │  │  │  │  └─ page.jsx
   │  │  │  └─ page.jsx
   │  │  ├─ layout.jsx
   │  │  ├─ page.jsx
   │  │  ├─ quotations
   │  │  │  ├─ [id]
   │  │  │  │  ├─ ActivityTimeline.jsx
   │  │  │  │  ├─ QuotationActionBar.jsx
   │  │  │  │  ├─ SendEmailModal.jsx
   │  │  │  │  ├─ ShareLinkModal.jsx
   │  │  │  │  └─ page.jsx
   │  │  │  └─ page.jsx
   │  │  ├─ roles
   │  │  │  └─ page.jsx
   │  │  ├─ sync
   │  │  │  └─ page.jsx
   │  │  ├─ unauthorized
   │  │  │  └─ page.jsx
   │  │  └─ users
   │  │     └─ page.jsx
   │  ├─ globals.css
   │  ├─ layout.jsx
   │  ├─ page.jsx
   │  └─ providers.jsx
   ├─ components
   │  └─ attachments
   │     ├─ AttachmentActions.jsx
   │     ├─ AttachmentManager.jsx
   │     ├─ AttachmentPreview.jsx
   │     └─ AttachmentUpload.jsx
   ├─ lib
   │  ├─ authOptions.js
   │  ├─ db-queries
   │  │  ├─ getCustomers.js
   │  │  ├─ getItems.js
   │  │  ├─ getQuotations.js
   │  │  └─ getTaxes.js
   │  ├─ db.js
   │  ├─ rbac
   │  │  ├─ auth.js
   │  │  └─ permissions.js
   │  ├─ zoho
   │  │  ├─ attachments.js
   │  │  ├─ auth.js
   │  │  ├─ client.js
   │  │  ├─ config.js
   │  │  ├─ customers.js
   │  │  ├─ items.js
   │  │  ├─ quotations.js
   │  │  └─ taxes.js
   │  ├─ zoho-sync
   │  │  ├─ syncCustomers.js
   │  │  ├─ syncItems.js
   │  │  ├─ syncQuotations.js
   │  │  └─ syncTaxes.js
   │  └─ zoho.js
   ├─ models
   │  ├─ ActivityLog.js
   │  ├─ Customer.js
   │  ├─ Item.js
   │  ├─ Quotation.js
   │  ├─ Role.js
   │  ├─ SyncLog.js
   │  ├─ Tax.js
   │  └─ User.js
   └─ types
      └─ zoho-attachments.d.ts

```