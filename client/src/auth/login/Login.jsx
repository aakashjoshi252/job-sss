import { useFormik } from "formik";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { loginStart, loginSuccess, authFailed } from "../../redux/slices/authSlice";
import { setCompany, setCompanyLoading, setCompanyError } from "../../redux/slices/companySlice";
import { userApi, companyApi } from "../../api/api";
import LanguageSwitcher from "../../components/languageSwitcher/LanguageSwitcher";
import { translateApiError } from "../../utils/apiErrors";

const initialValue = {
  email: "",
  password: "",
};

export default function Login() {
  const { t } = useTranslation(["auth", "common", "errors", "validation"]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user: authenticatedUser } = useSelector((state) => state.auth);

  const submitHandler = async (values, { setFieldError }) => {
    setLoading(true);
    dispatch(loginStart());
    
    try {
      const res = await userApi.post("/login", values, {
        withCredentials: true,
      });

      const { user, token } = res.data;
      
      if (!user || !token) {
        setFieldError("email", t("login.errors.noUser"));
        dispatch(authFailed());
        return;
      }

      let latestUser = user;
      try {
        const profileRes = await userApi.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        latestUser = profileRes.data?.data?.user || profileRes.data?.user || user;
      } catch (profileErr) {
        console.warn("Unable to refresh profile after login:", profileErr);
      }

      // Dispatch login success with the freshest profile data and token.
      dispatch(loginSuccess({ user: latestUser, token }));

      // Fetch company data for recruiter immediately
      if (latestUser.role === "recruiter") {
        dispatch(setCompanyLoading());
        try {
          const companyRes = await companyApi.get(
            `/recruiter/${latestUser._id}`,
            { 
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true 
            }
          );

          const company = companyRes.data?.data || companyRes.data;
          
          if (company && company._id) {
            dispatch(setCompany(company));
            navigate("/recruiter/dashboard");
          } else {
            dispatch(setCompany(null));
            navigate("/recruiter/company/registration");
          }
        } catch (companyErr) {
          dispatch(setCompanyError(translateApiError(companyErr, t, "jobNotFound") || t("login.errors.companyNotFound")));
          navigate("/recruiter/company/registration");
        }
      } 
      else if (latestUser.role === "candidate") {
        navigate("/candidate/home");
      } 
      else if (latestUser.role === "admin") {
        navigate("/admin");
      }
      else {
        navigate("/");
      }
      
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = translateApiError(err, t, "invalidCredentials");
      setFieldError("email", errorMessage);
      dispatch(authFailed());
    } finally {
      setLoading(false);
    }
  };

  const { handleChange, handleSubmit, values, errors, touched } = useFormik({
    initialValues: initialValue,
    validate: (values) => {
      const errors = {};
      if (!values.email) {
        errors.email = t("validation:emailRequired");
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = t("validation:emailInvalid");
      }
      if (!values.password) {
        errors.password = t("validation:passwordRequired");
      } else if (values.password.length < 6) {
        errors.password = t("validation:passwordMin", { count: 6 });
      }
      return errors;
    },
    onSubmit: submitHandler,
  });

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    const redirectTo =
      authenticatedUser?.role === "candidate"
        ? "/candidate/home"
        : authenticatedUser?.role === "recruiter"
          ? "/recruiter/dashboard"
          : authenticatedUser?.role === "admin"
            ? "/admin"
            : "/";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md shadow-xl rounded-2xl p-8">
        <div className="mb-5 flex justify-end">
          <LanguageSwitcher compact />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {t("login.title")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              {t("fields.emailAddress", { ns: "common" })}
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              className={`w-full rounded-lg p-2.5 bg-gray-50 border
                ${errors.email && touched.email ? "border-red-500" : "border-gray-300"}
                focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder={t("placeholders.email", { ns: "common" })}
            />
            {errors.email && touched.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              {t("fields.password", { ns: "common" })}
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              className={`w-full rounded-lg p-2.5 bg-gray-50 border
                ${errors.password && touched.password ? "border-red-500" : "border-gray-300"}
                focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder={t("placeholders.password", { ns: "common" })}
            />
            {errors.password && touched.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <NavLink 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t("login.forgotPassword")}
            </NavLink>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg font-semibold text-white
              ${loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              } transition duration-200`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("login.submitting")}
              </span>
            ) : (
              t("login.submit")
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          {t("login.noAccount")}{" "}
          <NavLink 
            to="/login/register" 
            className="text-blue-600 font-medium hover:text-blue-800 hover:underline"
          >
            {t("login.createAccount")}
          </NavLink>
        </p>

        <Outlet />
      </div>
    </div>
  );
}
