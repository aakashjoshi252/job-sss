import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { companyApi } from "../../../../api/api";
import { GiJewelCrown } from "react-icons/gi";

const companyInitialValues = {
  uploadLogo: null,
  companyName: "",

  // JEWELRY SPECIFIC
  industry: "Jewelry & Gems",
  companyType: "",
  specializations: [],
  certifications: [],
  workshopFacilities: [],
  branches: [],
  socialMedia: {
    instagram: "",
    facebook: "",
    pinterest: "",
    youtube: ""
  },

  // GENERAL
  size: "",
  establishedYear: "",
  website: "",
  location: "",
  description: "",
  contactEmail: "",
  contactNumber: "",
};

// Jewelry constants
const COMPANY_TYPES = [
  "Jewelry Manufacturer",
  "Jewelry Retailer",
  "Jewelry Wholesaler",
  "Jewelry Designer Studio",
  "Gemstone Dealer",
  "Diamond Trading",
  "Jewelry Export House",
  "CAD/CAM Service Provider",
  "Jewelry School/Institute",
  "E-commerce Jewelry Platform",
  "Custom Jewelry Workshop",
  "Antique & Vintage Jewelry",
  "Other"
];

const SPECIALIZATIONS = [
  "Gold Jewelry",
  "Diamond Jewelry",
  "Silver Jewelry",
  "Platinum Jewelry",
  "Bridal Jewelry",
  "Fashion Jewelry",
  "Traditional Indian Jewelry",
  "Contemporary Designs",
  "Custom/Bespoke Jewelry",
  "Fine Jewelry",
  "Costume Jewelry",
  "Watches",
  "Gemstones & Diamonds (Loose)",
  "Lab-Grown Diamonds",
  "Repair & Restoration"
];

const CERTIFICATIONS = [
  "BIS Hallmark Certified",
  "ISO Certified",
  "RJC (Responsible Jewellery Council)",
  "Kimberley Process Certified",
  "Fair Trade Certified",
  "Conflict-Free Diamond Source",
  "GIA Authorized Dealer",
  "IGI Partner",
  "None"
];

const WORKSHOP_FACILITIES = [
  "In-house Design Studio",
  "CAD/CAM Lab",
  "3D Printing Facility",
  "Casting Workshop",
  "Stone Setting Department",
  "Polishing Unit",
  "Quality Testing Lab",
  "Gemology Lab",
  "Laser Engraving",
  "Photography Studio"
];

const BRANCH_TYPES = ["Retail Store", "Workshop", "Warehouse", "Office"];

export default function CompanyRegistration() {
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);

  const loggedUser = useSelector((state) => state.auth.user);
  const recruiterId = loggedUser?._id;

  const submithandler = async (values, { setSubmitting }) => {
    try {
      setApiError("");

      if (!recruiterId) {
        alert("Please login as recruiter first!");
        return;
      }

      // Client-side validation
      if (!values.companyName || !values.companyType || !values.size ||
        !values.establishedYear || !values.location || !values.description ||
        !values.contactEmail || !values.contactNumber) {
        alert("Please fill all required fields!");
        return;
      }

      const formData = new FormData();

      // File field
      if (values.uploadLogo) {
        formData.append("uploadLogo", values.uploadLogo);
      }

      // Basic fields (strings/numbers)
      formData.append("companyName", values.companyName);
      formData.append("industry", values.industry);
      formData.append("companyType", values.companyType);
      formData.append("size", values.size);
      formData.append("establishedYear", values.establishedYear);
      formData.append("website", values.website || "");
      formData.append("location", values.location);
      formData.append("description", values.description);
      formData.append("contactEmail", values.contactEmail);
      formData.append("contactNumber", values.contactNumber);
      formData.append("recruiterId", recruiterId);

      // Arrays and objects as JSON strings
      formData.append("specializations", JSON.stringify(values.specializations));
      formData.append("certifications", JSON.stringify(values.certifications));
      formData.append("workshopFacilities", JSON.stringify(values.workshopFacilities));
      formData.append("branches", JSON.stringify(branches));
      formData.append("socialMedia", JSON.stringify(values.socialMedia));

      const response = await companyApi.post("/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(response.data.message);
      localStorage.setItem("companyRegistered", "true");
      navigate("/recruiter/dashboard/");

    } catch (error) {
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.message || "Something went wrong, please try again.";
      const missingFields = error.response?.data?.missing;

      if (missingFields) {
        const missing = Object.entries(missingFields)
          .filter(([key, value]) => value === true)
          .map(([key]) => key);

        if (missing.length > 0) {
          alert(`Missing required fields: ${missing.join(", ")}`);
        }
      }

      setApiError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues: companyInitialValues,
    onSubmit: submithandler,
    // NO validation schema - we handle validation manually
  });

  const handleMultiSelect = (field, value) => {
    const currentValues = formik.values[field];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    formik.setFieldValue(field, newValues);
  };

  const addBranch = () => {
    setBranches([...branches, { city: "", address: "", type: "Retail Store" }]);
  };

  const updateBranch = (index, field, value) => {
    const updatedBranches = [...branches];
    updatedBranches[index][field] = value;
    setBranches(updatedBranches);
  };

  const removeBranch = (index) => {
    setBranches(branches.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Matching Dashboard Style */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <GiJewelCrown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Register Your Company
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Register your company to start hiring jewelry professionals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={formik.handleSubmit} noValidate className="p-6 sm:p-8 space-y-6">
            {/* ========== JEWELRY BUSINESS SPECIFICS ========== */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Your Business Info</h3>
                <span className="text-xs font-semibold text-red-700 bg-yellow-100 px-2 py-1 rounded-lg">
                  Required Fields
                </span>
              </div>

              {/* Company Type */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="companyType"
                  value={formik.values.companyType}
                  onChange={formik.handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Select Business Type</option>
                  {COMPANY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formik.touched.companyType && !formik.values.companyType && (
                  <p className="text-xs text-red-600 mt-1">Business type is required</p>
                )}
              </div>

              {/* Specializations */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Specializations (Select multiple)
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SPECIALIZATIONS.map(spec => (
                      <label key={spec} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition">
                        <input
                          type="checkbox"
                          checked={formik.values.specializations.includes(spec)}
                          onChange={() => handleMultiSelect('specializations', spec)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formik.values.specializations.length}
                </p>
              </div>

              {/* Certifications */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Certifications & Accreditations
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {CERTIFICATIONS.map(cert => (
                      <label key={cert} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition">
                        <input
                          type="checkbox"
                          checked={formik.values.certifications.includes(cert)}
                          onChange={() => handleMultiSelect('certifications', cert)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">{cert}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workshop Facilities */}
              <div className="mb-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Workshop & Facilities
                </label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {WORKSHOP_FACILITIES.map(facility => (
                      <label key={facility} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition">
                        <input
                          type="checkbox"
                          checked={formik.values.workshopFacilities.includes(facility)}
                          onChange={() => handleMultiSelect('workshopFacilities', facility)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ========== BASIC INFORMATION ========== */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Basic Information</h3>

              {/* Logo Upload */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Upload Company Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => formik.setFieldValue("uploadLogo", e.target.files[0])}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Company Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formik.values.companyName}
                    onChange={formik.handleChange}
                    required
                    placeholder="e.g. Krishna Jewellery"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Established Year */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Established Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formik.values.establishedYear}
                    onChange={formik.handleChange}
                    required
                    placeholder="e.g. 1994"
                    min="1800"
                    max="2026"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Company Size */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Company Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="size"
                    value={formik.values.size}
                    onChange={formik.handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Size</option>
                    <option value="1-10">1–10 employees</option>
                    <option value="11-50">11–50 employees</option>
                    <option value="51-200">51–200 employees</option>
                    <option value="201-500">201–500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formik.values.website}
                    onChange={formik.handleChange}
                    placeholder="https://www.example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Head Office Location */}
              <div className="mb-5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Head Office Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  required
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Contact Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formik.values.contactEmail}
                    onChange={formik.handleChange}
                    required
                    placeholder="contact@company.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formik.values.contactNumber}
                    onChange={formik.handleChange}
                    required
                    placeholder="+91 1234567890"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Company Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  required
                  placeholder="Tell us about your company, products, and services..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                />
              </div>
            </div>

            {/* ========== ADDITIONAL BRANCHES ========== */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Additional Locations / Branches</h3>
                <button
                  type="button"
                  onClick={addBranch}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                >
                  + Add Branch
                </button>
              </div>

              {branches.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No additional branches added yet</p>
              ) : (
                <div className="space-y-3">
                  {branches.map((branch, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={branch.city}
                        onChange={(e) => updateBranch(index, 'city', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Address"
                        value={branch.address}
                        onChange={(e) => updateBranch(index, 'address', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <select
                        value={branch.type}
                        onChange={(e) => updateBranch(index, 'type', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {BRANCH_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeBranch(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========== SOCIAL MEDIA ========== */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/yourcompany"
                    value={formik.values.socialMedia.instagram}
                    onChange={(e) => formik.setFieldValue('socialMedia.instagram', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/yourcompany"
                    value={formik.values.socialMedia.facebook}
                    onChange={(e) => formik.setFieldValue('socialMedia.facebook', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pinterest</label>
                  <input
                    type="url"
                    placeholder="https://pinterest.com/yourcompany"
                    value={formik.values.socialMedia.pinterest}
                    onChange={(e) => formik.setFieldValue('socialMedia.pinterest', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">YouTube</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@yourcompany"
                    value={formik.values.socialMedia.youtube}
                    onChange={(e) => formik.setFieldValue('socialMedia.youtube', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* API ERROR */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">Error:</p>
                <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg font-medium text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formik.isSubmitting ? "Registering..." : "Register"}
              </button>

              <button
                type="button"
                onClick={() => {
                  formik.resetForm();
                  setBranches([]);
                }}
                className="order-2 sm:order-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-6 rounded-lg font-medium text-sm transition"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
