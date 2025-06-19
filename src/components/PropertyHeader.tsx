
interface PropertyHeaderProps {
  title: string;
  subtitle: string;
}

export const PropertyHeader = ({ title, subtitle }: PropertyHeaderProps) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="px-4 py-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex-shrink-0">
            <img 
              src="/lovable-uploads/0a50e8a6-9077-4594-a62f-b9afd7bac687.png" 
              alt="DoubleCheck Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">DoubleCheck</h1>
            <p className="text-sm text-gray-600 mt-1">Powered by Rent Responsibly</p>
          </div>
        </div>
      </div>
    </div>
  );
};
