import { useNavigate } from 'react-router-dom';
import { Loader2, Receipt } from 'lucide-react';
import MobileBottomNavNew from '@/components/custodian/MobileBottomNavNew';
import ExpenseCard from '@/components/custodian/ExpenseCard';
import CreateExpenseForm from '@/components/custodian/CreateExpenseForm';
import { useCustodianExpenses } from '@/hooks/useCustodianExpenses';

const CustodianExpensesPage = () => {
  const navigate = useNavigate();
  const { data: expenses, isLoading } = useCustodianExpenses();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Mis Gastos
        </h1>
        <p className="text-xs text-muted-foreground">Solicita reembolso de gastos extraordinarios</p>
      </div>

      {/* Create button */}
      <div className="px-4 pt-4">
        <CreateExpenseForm />
      </div>

      {/* List */}
      <main className="px-4 pt-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !expenses?.length ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tienes solicitudes de gastos</p>
            <p className="text-xs text-muted-foreground">Usa el botón de arriba para crear una</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))
        )}
      </main>

      <MobileBottomNavNew activeItem="expenses" onNavigate={(item) => {
        if (item === 'home') navigate('/custodian');
        else if (item === 'services') navigate('/custodian/services');
        else if (item === 'vehicle') navigate('/custodian/vehicle');
        else if (item === 'support') navigate('/custodian/support');
        else if (item === 'expenses') navigate('/custodian/expenses');
      }} />
    </div>
  );
};

export default CustodianExpensesPage;
