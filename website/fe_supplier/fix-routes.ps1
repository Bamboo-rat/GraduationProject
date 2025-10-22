# Script to add DashboardLayout and ProtectedRoute to all supplier routes

$routeFiles = @(
    "finance\transactions.tsx",
    "finance\withdraw.tsx",
    "products\categories.tsx",
    "products\review-status.tsx",
    "orders\returns.tsx",
    "store\profile.tsx",
    "store\update-history.tsx",
    "store\update-request.tsx",
    "reports\delivery.tsx",
    "reports\revenue-over-time.tsx",
    "reports\reviews-analysis.tsx",
    "reports\top-products.tsx",
    "feedback\reviews.tsx",
    "feedback\support.tsx",
    "delivery\assign.tsx",
    "delivery\tracking.tsx",
    "settings\notifications.tsx",
    "settings\payment.tsx",
    "settings\policies.tsx"
)

foreach ($file in $routeFiles) {
    $filePath = "app\routes\$file"
    
    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        
        $content = Get-Content $filePath -Raw
        
        # Check if already has DashboardLayout
        if ($content -notmatch "DashboardLayout") {
            # Add imports
            $content = $content -replace "(import type .+\r?\n)(import .+ from .+;)", "`$1`$2`nimport DashboardLayout from '~/component/DashboardLayout';`nimport ProtectedRoute from '~/component/ProtectedRoute';"
            
            # Wrap return statement
            $content = $content -replace "export default function (\w+)\(\) \{\s+return (<\w+.+/>);", @"
export default function `$1() {
  return (
    <ProtectedRoute requireRoles={['SUPPLIER']}>
      <DashboardLayout>
        `$2
      </DashboardLayout>
    </ProtectedRoute>
  );
"@
            
            Set-Content $filePath $content -NoNewline
            Write-Host "  ✓ Updated" -ForegroundColor Green
        } else {
            Write-Host "  - Already has DashboardLayout" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  × File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "`nDone! All routes have been updated." -ForegroundColor Green
