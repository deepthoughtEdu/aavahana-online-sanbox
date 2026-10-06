'use client';

import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { useAlert } from "@/lib/hooks/shared/use-alert";
import { 
  Settings, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  HelpCircle,
  LogOut,
  Edit,
  Loader
} from "lucide-react";

export default function AlertTestPage() {
  const { 
    info, 
    success, 
    warning, 
    error, 
    question, 
    confirm, 
    delete: deleteAlert 
  } = useAlert();

  // ============================================================================
  // BASIC ALERTS
  // ============================================================================

  const handleInfo = async () => {
    await info({
      title: 'Welcome!',
      message: 'This is an information message using your design system.',
    });
  };

  const handleSuccess = async () => {
    await success({
      title: 'Great!',
      message: 'Operation completed successfully.',
    });
  };

  const handleWarning = async () => {
    await warning({
      title: 'Heads up!',
      message: 'This action requires your attention.',
    });
  };

  const handleError = async () => {
    await error({
      title: 'Oops!',
      message: 'Something went wrong. Please try again.',
    });
  };

  // ============================================================================
  // CONFIRMATIONS
  // ============================================================================

  const handleConfirm = async () => {
    const result = await confirm({
      title: 'Save Changes?',
      message: 'Your changes will be saved to the database.',
    });

    if (result.isConfirmed) {
      await success({ title: 'Saved!', message: 'Changes have been saved.' });
    }
  };

  const handleQuestion = async () => {
    const result = await question({
      title: 'Enable Notifications?',
      message: 'You will receive updates about important events.',
      confirmText: 'Yes, enable',
      cancelText: 'No thanks',
    });

    if (result.isConfirmed) {
      await success({ title: 'Enabled!', message: 'Notifications are now active.' });
    }
  };

  // ============================================================================
  // DELETE CONFIRMATIONS
  // ============================================================================

  const handleDeleteSingle = async () => {
    const result = await deleteAlert({
      resourceName: 'User',
      // Auto-generates warning message
    });

    if (result.isConfirmed) {
      await success({ title: 'Deleted!', message: 'User has been removed.' });
    }
  };

  const handleDeleteMultiple = async () => {
    const result = await deleteAlert({
      resourceName: 'Product',
      plural: true,
    });

    if (result.isConfirmed) {
      await success({ 
        resourceName: 'Product', 
        plural: true,
        message: 'All selected products have been deleted.' 
      });
    }
  };

  const handleDeleteCustom = async () => {
    const result = await deleteAlert({
      title: 'Delete Account?',
      message: 'This will permanently delete your account and all associated data. This action cannot be undone.',
      confirmText: 'Yes, delete my account',
      cancelText: 'No, keep it',
    });

    if (result.isConfirmed) {
      await info({ 
        title: 'Account Deletion', 
        message: 'This is just a demo - no account was actually deleted!' 
      });
    }
  };

  // ============================================================================
  // RESOURCE-BASED MESSAGES
  // ============================================================================

  const handleResourceSuccess = async () => {
    await success({
      resourceName: 'Order',
      // Auto-generates: "Order was successful!"
    });
  };

  const handleResourceError = async () => {
    await error({
      resourceName: 'Payment',
      message: 'Your payment could not be processed. Please check your card details.',
    });
  };

  // ============================================================================
  // INPUT DIALOGS
  // ============================================================================

  const handleRename = async () => {
    const result = await confirm({
      type: 'question',
      title: 'Rename File',
      message: 'Enter a new name for this file:',
      input: 'text',
      inputPlaceholder: 'File name',
      inputValidator: (value:string) => {
        if (!value) return 'File name is required!';
        if (value.length < 3) return 'File name must be at least 3 characters!';
        return null;
      },
    });

    if (result.isConfirmed && result.value) {
      await success({ 
        title: 'Renamed!', 
        message: `File renamed to "${result.value}"` 
      });
    }
  };

  const handleFeedback = async () => {
    const result = await confirm({
      type: 'info',
      title: 'Share Your Feedback',
      message: 'Tell us what you think:',
      input: 'textarea',
      inputPlaceholder: 'Your feedback...',
      confirmText: 'Submit',
      showCancel: true,
    });

    if (result.isConfirmed && result.value) {
      await success({ 
        title: 'Thank you!', 
        message: 'Your feedback has been submitted.' 
      });
    }
  };

  // ============================================================================
  // HTML CONTENT
  // ============================================================================

  const handleHTML = async () => {
    await info({
      title: 'New Features 🎉',
      html: `
        <div class="text-left space-y-3">
          <div class="flex gap-2 mb-3">
            <span class="badge badge-primary">New</span>
            <span class="badge badge-success">Updated</span>
          </div>
          <ul class="list-disc list-inside space-y-2">
            <li><strong>Dark Mode:</strong> Toggle between light and dark themes</li>
            <li><strong>Performance:</strong> 50% faster page loads</li>
            <li><strong>Dashboard:</strong> Redesigned analytics view</li>
          </ul>
        </div>
      `,
    });
  };

  // ============================================================================
  // REAL-WORLD SCENARIOS
  // ============================================================================

  const handleLogout = async () => {
    const result = await question({
      title: 'Sign Out?',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Stay',
    });

    if (result.isConfirmed) {
      await info({ title: 'Signed Out', message: 'Demo only - you\'re still logged in!' });
    }
  };

  const handleFormSubmit = async () => {
    const result = await confirm({
      title: 'Submit Form?',
      message: 'Please review your information before submitting.',
      confirmText: 'Submit',
    });

    if (result.isConfirmed) {
      await success({ 
        title: 'Submitted!', 
        message: 'Your form has been submitted successfully.' 
      });
    }
  };

  // ============================================================================
  // CHAINED ALERTS
  // ============================================================================

  const handleMultiStep = async () => {
    // Step 1: Warning
    const step1 = await warning({
      title: 'Before You Continue',
      message: 'This action will affect multiple records. Do you want to proceed?',
    });

    if (!step1.isConfirmed) return;

    // Step 2: Final confirmation
    const step2 = await deleteAlert({
      resourceName: 'Record',
      plural: true,
      confirmText: 'Yes, I understand',
    });

    if (!step2.isConfirmed) return;

    // Step 3: Success
    await success({
      title: 'Complete!',
      message: 'All records have been updated successfully.',
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">
          useAlert Hook Test Page
        </h1>
        <p className="text-[#555555]">
          Test all alert types with your design system components
        </p>
      </div>

      {/* Basic Alerts */}
      <Section>
        <Section.Header 
          icon={<Info />}
          title="Basic Alerts"
          subtitle="Simple notifications without confirmations"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="info" 
              onClick={handleInfo}
              iconBefore={<Info size={16} />}
            >
              Info
            </Button>
            <Button 
              color="success" 
              onClick={handleSuccess}
              iconBefore={<CheckCircle size={16} />}
            >
              Success
            </Button>
            <Button 
              color="warning" 
              onClick={handleWarning}
              iconBefore={<AlertCircle size={16} />}
            >
              Warning
            </Button>
            <Button 
              color="error" 
              onClick={handleError}
              iconBefore={<AlertCircle size={16} />}
            >
              Error
            </Button>
          </div>
        </Section.Body>
      </Section>

      {/* Confirmations */}
      <Section>
        <Section.Header 
          icon={<HelpCircle />}
          title="Confirmation Dialogs"
          subtitle="Yes/No questions and confirmations"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="primary" 
              onClick={handleConfirm}
              iconBefore={<Save size={16} />}
            >
              Confirm Action
            </Button>
            <Button 
              color="accent" 
              onClick={handleQuestion}
              iconBefore={<HelpCircle size={16} />}
            >
              Yes/No Question
            </Button>
          </div>
        </Section.Body>
      </Section>

      {/* Delete Confirmations */}
      <Section>
        <Section.Header 
          icon={<Trash2 />}
          title="Delete Confirmations"
          subtitle="Dangerous actions with warnings"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="error" 
              onClick={handleDeleteSingle}
              iconBefore={<Trash2 size={16} />}
            >
              Delete User
            </Button>
            <Button 
              color="error" 
              variant="outline"
              onClick={handleDeleteMultiple}
              iconBefore={<Trash2 size={16} />}
            >
              Delete Multiple
            </Button>
            <Button 
              color="error" 
              variant="soft"
              onClick={handleDeleteCustom}
              iconBefore={<Trash2 size={16} />}
            >
              Delete Account
            </Button>
          </div>
        </Section.Body>
      </Section>

      {/* Resource-Based */}
      <Section>
        <Section.Header 
          icon={<Settings />}
          title="Resource-Based Messages"
          subtitle="Auto-generated titles and messages"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="success" 
              onClick={handleResourceSuccess}
              iconBefore={<CheckCircle size={16} />}
            >
              Order Success
            </Button>
            <Button 
              color="error" 
              onClick={handleResourceError}
              iconBefore={<AlertCircle size={16} />}
            >
              Payment Error
            </Button>
          </div>
        </Section.Body>
      </Section>

      {/* Input Dialogs */}
      <Section>
        <Section.Header 
          icon={<Edit />}
          title="Input Dialogs"
          subtitle="Get user input with validation"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="primary" 
              onClick={handleRename}
              iconBefore={<Edit size={16} />}
            >
              Rename File
            </Button>
            <Button 
              color="accent" 
              onClick={handleFeedback}
              iconBefore={<Edit size={16} />}
            >
              Give Feedback
            </Button>
          </div>
        </Section.Body>
      </Section>

      {/* HTML Content */}
      <Section>
        <Section.Header 
          icon={<Info />}
          title="Custom HTML"
          subtitle="Rich formatted content"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="info" 
              onClick={handleHTML}
              iconBefore={<Info size={16} />}
            >
              Show Features
            </Button>
          </div>
        </Section.Body>
      </Section>

      {/* Real-World Scenarios */}
      <Section>
        <Section.Header 
          icon={<Settings />}
          title="Real-World Examples"
          subtitle="Common use cases"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="secondary" 
              onClick={handleLogout}
              iconBefore={<LogOut size={16} />}
            >
              Logout
            </Button>
            <Button 
              color="primary" 
              onClick={handleFormSubmit}
              iconBefore={<Save size={16} />}
            >
              Submit Form
            </Button>
          </div>
        </Section.Body>
      </Section>

      {/* Advanced */}
      <Section variant="bordered">
        <Section.Header 
          icon={<Loader />}
          title="Advanced Patterns"
          subtitle="Chained and complex flows"
        />
        <Section.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              color="warning" 
              onClick={handleMultiStep}
              iconBefore={<AlertCircle size={16} />}
            >
              Multi-Step Process
            </Button>
          </div>
        </Section.Body>
        <Section.Footer>
          <div className="text-sm text-[#555555]">
            💡 <strong>Tip:</strong> Check the browser console for result logging
          </div>
        </Section.Footer>
      </Section>
    </div>
  );
}