import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../api/api";
import { getPersistedLanguage } from "../i18n/storage";

const getStoredToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const clearStoredAuth = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
};

const baseUrl = API_BASE_URL;

if (import.meta.env.DEV) {
  console.log("API URL:", baseUrl);
}

const baseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");

    const token = getStoredToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const language = getPersistedLanguage();
    headers.set("Accept-Language", language);
    headers.set("X-Language", language);

    return headers;
  },
});

const baseQueryWithAuth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !window.location.pathname.includes("/login")) {
    clearStoredAuth();
    window.location.assign("/login");
  }

  return result;
};

const unwrapListResponse = (response) => response?.data ?? response ?? [];
const unwrapEntityResponse = (response) => response?.data ?? response ?? null;

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Company", "Job", "Blog"],
  keepUnusedDataFor: 300,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getCompanies: builder.query({
      query: ({ page = 1, limit = 9, search = "", industry = "", sort = "createdAt" } = {}) => ({
        url: "/company",
        params: { page, limit, search, industry, sort },
      }),
      transformResponse: (response, _meta, arg = {}) => {
        const page = arg.page ?? 1;
        const limit = arg.limit ?? 9;
        const companies = unwrapListResponse(response);

        return {
          companies,
          pagination: response?.pagination ?? {
            page,
            limit,
            total: companies.length,
            pages: 1,
          },
        };
      },
      providesTags: (result) =>
        result?.companies
          ? [
              ...result.companies.map((company) => ({ type: "Company", id: company._id })),
              { type: "Company", id: "LIST" },
            ]
          : [{ type: "Company", id: "LIST" }],
    }),
    getCompanyById: builder.query({
      query: (companyId) => `/company/${companyId}`,
      transformResponse: unwrapEntityResponse,
      providesTags: (_result, _error, companyId) => [{ type: "Company", id: companyId }],
    }),
    getCompanyJobs: builder.query({
      query: (companyId) => `/jobs/company/${companyId}`,
      transformResponse: unwrapListResponse,
      providesTags: (_result, _error, companyId) => [{ type: "Job", id: `COMPANY-${companyId}` }],
    }),
    getJobs: builder.query({
      query: (params = {}) => ({
        url: "/jobs",
        params,
      }),
      transformResponse: unwrapListResponse,
      providesTags: [{ type: "Job", id: "LIST" }],
    }),
    getCandidateJobs: builder.query({
      query: (params = {}) => ({
        url: "/jobs/candidate/recommended",
        params,
      }),
      transformResponse: (response) => ({
        jobs: unwrapListResponse(response),
        pagination: response?.pagination ?? null,
        filters: response?.filters ?? {},
      }),
      providesTags: [{ type: "Job", id: "CANDIDATE-FEED" }],
    }),
    getCompanyBlogs: builder.query({
      query: ({ companyId, status = "published", limit = 3 }) => ({
        url: `/blogs/company/${companyId}`,
        params: { status, limit },
      }),
      transformResponse: (response, _meta, arg = {}) => {
        const limit = arg.limit ?? 3;
        const blogs = response?.data?.blogs ?? response?.blogs ?? response?.data ?? response ?? [];
        return Array.isArray(blogs) ? blogs.slice(0, limit) : [];
      },
      providesTags: (_result, _error, { companyId }) => [{ type: "Blog", id: `COMPANY-${companyId}` }],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useGetCompanyByIdQuery,
  useGetCompanyJobsQuery,
  useGetJobsQuery,
  useGetCandidateJobsQuery,
  useGetCompanyBlogsQuery,
} = apiSlice;
