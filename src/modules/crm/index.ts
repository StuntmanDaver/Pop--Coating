// Public API for the CRM module.
// docs/DESIGN.md §4.3 Module 2 (CRM). Cross-module imports must enter through this file only.

export { createCompany, updateCompany, archiveCompany } from './actions/companies'
export type { CreateCompanyInput, UpdateCompanyInput } from './actions/companies'

export { listCompanies, getCompanyById } from './queries/companies'
export type { ListCompaniesParams, CompanyListItem } from './queries/companies'

export { createContact, updateContact, archiveContact } from './actions/contacts'
export type { CreateContactInput, UpdateContactInput } from './actions/contacts'

export { listContacts, getContactById } from './queries/contacts'
export type { ListContactsParams, ContactListItem } from './queries/contacts'
