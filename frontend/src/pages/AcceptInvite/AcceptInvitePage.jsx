import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../utils/api.js";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const AcceptInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [blogTitle, setBlogTitle] = useState("");

  useEffect(() => {
    if (!token) {
      setTimeout(() => {
        setStatus("error");
        setMessage("No invite token found in URL.");
      }, 0);
      return;
    }

    const acceptInvite = async () => {
      try {
        const response = await apiClient.get(
          `/collaborator/accept-invite/${token}`,
        );
        if (response.data.success) {
          setStatus("success");
          setMessage(response.data.message);
          setBlogTitle(response.data.blogTitle);
          setSectionTitle(response.data.sectionTitle);
          // Auto-redirect to blog editor with section
          setTimeout(() => {
            navigate(
              `/edit-blog/${response.data.blogId}?section=${response.data.sectionId}`,
            );
          }, 3000);
        }
      } catch (error) {
        console.error("Accept invite error:", error);
        setStatus("error");
        if (error.response?.status === 400) {
          setMessage("Invalid or expired invite token.");
        } else if (error.response?.status === 404) {
          setMessage("User account not found. Please register or login first.");
        } else {
          setMessage("Failed to accept invite. Please try again.");
        }
      }
    };

    acceptInvite();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === "success"
              ? "🎉 Success!"
              : status === "loading"
                ? "Processing Invite..."
                : "Invite Error"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Accepting collaboration invite..."}
            {status === "success" &&
              `You are now a collaborator on "${blogTitle}"! Redirecting to profile...`}
            {status === "error" && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}
          {status === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}
          {status === "error" && (
            <>
              <Button onClick={() => window.history.back()} className="w-full">
                Go Back
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Login/Register
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;
