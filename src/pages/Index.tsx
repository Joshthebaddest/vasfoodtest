// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { ChefHat, Users, History, ArrowRight } from "lucide-react";
//
// const Index = () => {
//   const navigate = useNavigate();
//
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background p-4">
//       <Card className="w-full max-w-2xl">
//         <CardHeader className="text-center">
//           <div className="flex justify-center mb-4">
//             <ChefHat className="h-16 w-16 text-primary" />
//           </div>
//           <CardTitle className="text-3xl font-bold">Vas2nets Internal Food Ordering</CardTitle>
//           <CardDescription className="text-lg">
//             Choose your portal to access the food ordering system
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div
//               onClick={() => navigate('/login')}
//               className="cursor-pointer group"
//             >
//               <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-primary">
//                 <CardContent className="pt-6 text-center">
//                   <Users className="h-12 w-12 text-primary mx-auto mb-4" />
//                   <h3 className="text-xl font-semibold mb-2">Staff Portal</h3>
//                   <p className="text-muted-foreground mb-4">
//                     Place your daily lunch orders and track your meal history
//                   </p>
//                   <Button className="w-full bg-primary hover:bg-primary-hover text-primary-foreground group-hover:scale-105 transition-transform">
//                     Enter as Staff
//                     <ArrowRight className="ml-2 h-4 w-4" />
//                   </Button>
//                 </CardContent>
//               </Card>
//             </div>
//
//             <div
//               onClick={() => navigate('/login')}
//               className="cursor-pointer group"
//             >
//               <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-primary">
//                 <CardContent className="pt-6 text-center">
//                   <History className="h-12 w-12 text-primary mx-auto mb-4" />
//                   <h3 className="text-xl font-semibold mb-2">HR Portal</h3>
//                   <p className="text-muted-foreground mb-4">
//                     Manage orders, notify staff, and generate reports
//                   </p>
//                   <Button className="w-full bg-primary hover:bg-primary-hover text-primary-foreground group-hover:scale-105 transition-transform">
//                     Enter as HR
//                     <ArrowRight className="ml-2 h-4 w-4" />
//                   </Button>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//
//           <div className="mt-8 text-center">
//             <p className="text-sm text-muted-foreground">
//               Need help? Contact IT support or check the user guide
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };
//
// export default Index;
