import ManageProductsModal from './components/ManageProductsModal.jsx'
import AddProductModal from './components/AddProductModal.jsx'
import CreateAdminModal from './components/CreateAdminModal.jsx'
import QuoteForm from './components/QuoteForm.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import ProductListTable from './components/ProductListTable.jsx'
import OrderDiscountSummary from './components/OrderDiscountSummary.jsx'
import CustomerInfo from './components/CustomerInfo.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import ExportQuoteButton from './components/ExportQuoteButton.jsx'
import OrderHistory from './components/OrderHistory.jsx'
import Sidebar from './components/Sidebar.jsx'
import QuoteHeader from './components/QuoteHeader.jsx'
import FrameCostCalculator from './components/FrameCostCalculator.jsx'
import SalesDashboard from './components/SalesDashboard.jsx'
import { formatVND } from './utils/format.js'
import { useQuoteBuilder } from './hooks/useQuoteBuilder.js'

export default function App() {
  const {
    isManageProductsModalOpen,
    setIsManageProductsModalOpen,
    isAddProductModalOpen,
    setIsAddProductModalOpen,
    isCreateAdminModalOpen,
    setIsCreateAdminModalOpen,
    customerName,
    setCustomerName,
    view,
    setView,
    sidebarOpen,
    setSidebarOpen,
    showLogin,
    setShowLogin,
    exportMessage,
    mode,
    handleModeChange,
    user,
    isAdmin,
    canSeeCost,
    isSaleRole,
    handleLogin,
    handleLogout,
    orders,
    deleteOrder,
    updateOrderStatus,
    items,
    handleRemoveItem,
    itemsSubtotal,
    itemsCost,
    itemsTotal,
    discountPercent,
    setDiscountPercent,
    canExport,
    handleExport,
    settings,
    updateSetting,
    resetSettings,
    standardPrices,
    updateStandardPrice,
    resetStandardPrices,
    typeRates,
    updateTypeRate,
    resetTypeRates,
    formProps,
    resultPanelProps,
  } = useQuoteBuilder()

  return (
    <div className="min-h-screen bg-paper font-body flex">
      <Sidebar
        view={view}
        onViewChange={setView}
        isAdmin={isAdmin}
        canSeeCost={canSeeCost}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
        user={user}
        onAddProductClick={() => setIsAddProductModalOpen(true)}
        onCreateAdminClick={() => setIsCreateAdminModalOpen(true)}
        onManageProductsClick={() => setIsManageProductsModalOpen(true)}
      />

      <div className="flex-1 min-w-0 pb-28 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 lg:pt-10 pb-6">
          <QuoteHeader onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {view === 'history' && isAdmin ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <OrderHistory
              orders={orders}
              onDelete={deleteOrder}
              isAdmin={canSeeCost}
              onUpdateStatus={updateOrderStatus}
              currentUser={user}
              isSaleRole={isSaleRole}
            />
          </div>
        ) : view === 'dashboard' && isAdmin ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <SalesDashboard
              orders={orders}
              canSeeCost={canSeeCost}
              currentUser={user}
              isSaleRole={isSaleRole}
            />
          </div>
        ) : (
          <>
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <CustomerInfo value={customerName} onChange={setCustomerName} />
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-6 items-start">
              <QuoteForm mode={mode} onModeChange={handleModeChange} {...formProps} />

              <div className="hidden lg:block lg:sticky lg:top-6">
                <ResultPanel {...resultPanelProps} />
              </div>
            </main>

            <div className="lg:hidden max-w-5xl mx-auto px-4 sm:px-6 mt-6">
              <ResultPanel {...resultPanelProps} />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
              <h2 className="font-display font-semibold text-lg text-blueprint mb-3">
                Danh sách báo giá
              </h2>
              <ProductListTable
                items={items}
                onRemove={handleRemoveItem}
                itemsSubtotal={itemsSubtotal}
              />
              <OrderDiscountSummary
                itemsSubtotal={itemsSubtotal}
                discountPercent={discountPercent}
                onDiscountChange={setDiscountPercent}
                itemsTotal={itemsTotal}
                disabled={items.length === 0}
              />
              <ExportQuoteButton
                onExport={handleExport}
                disabled={!canExport}
                message={exportMessage}
              />
            </div>

            {canSeeCost && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <AdminPanel itemsCost={itemsCost} itemsTotal={itemsTotal} />
                <FrameCostCalculator
                  settings={settings}
                  updateSetting={updateSetting}
                  resetSettings={resetSettings}
                  standardPrices={standardPrices}
                  updateStandardPrice={updateStandardPrice}
                  resetStandardPrices={resetStandardPrices}
                  typeRates={typeRates}
                  updateTypeRate={updateTypeRate}
                  resetTypeRates={resetTypeRates}
                />
              </div>
            )}
          </>
        )}

        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-blueprint text-paper px-4 py-3 flex items-center justify-between border-t border-paper/10">
          <span className="font-mono text-xs uppercase tracking-widest text-paper/60">
            Tổng đơn ({items.length} SP)
          </span>
          <span className="font-mono text-xl font-bold text-amber">
            {formatVND(itemsTotal)}
          </span>
        </div>
      </div>

      {showLogin && (
        <AdminLogin onLogin={handleLogin} onCancel={() => setShowLogin(false)} />
      )}

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
      />

      <CreateAdminModal
        isOpen={isCreateAdminModalOpen}
        onClose={() => setIsCreateAdminModalOpen(false)}
      />

      <ManageProductsModal
        isOpen={isManageProductsModalOpen}
        onClose={() => setIsManageProductsModalOpen(false)}
      />
    </div>
  )
}
